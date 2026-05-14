import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScoreV2 } from '@/lib/scoring';
import { z } from 'zod';
import { PropertyDataV2 } from '@/lib/domain/energy-assessment';
import { CadastralMatchSchema } from '@/lib/catastro/types';
import { isAllowedPhotoAttachment, validatePhotoAttachments } from '@/lib/attachments';
import { deleteStoredAttachment, saveAssessmentAttachment } from '@/lib/blob-storage';
import { createStatelessAssessmentId, createStatelessPayload } from '@/lib/stateless-assessment';
import { auth } from '@/auth';
import {
  normalizePropertyType,
  normalizeHeatingSystem,
  normalizeCoolingSystem,
  normalizeWaterHeatingSystem,
  normalizeWindowType,
  normalizeRenewableSystem,
  normalizeInsulationLevel,
  normalizeBudgetRange,
  normalizeAssessmentObjective,
  normalizeEnergyLetter,
  normalizePropertyOrientation,
  normalizeRoofType,
  normalizeVentilationType,
  normalizeTimelineHorizon
} from '@/lib/domain/normalizers';
import { EnergyCertificateCEE, RehabBudgetAnalysis } from '@/lib/ingestion/types';
import { budgetToPrismaCreate, certificateToPrismaCreate, fieldsToPrismaCreateMany } from '@/lib/ingestion/persistence';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const assessmentSchema = z.object({

  year: z.number().or(z.string().transform(Number)).pipe(z.number().min(1800).max(new Date().getFullYear())),
  area: z.number().or(z.string().transform(Number)).pipe(z.number().positive().max(2000)),
  zipcode: z.string().min(4).max(10),
  propertyType: z.any().transform(normalizePropertyType),
  orientation: z.any().transform(normalizePropertyOrientation).optional(),
  roofType: z.any().transform(normalizeRoofType).optional(),
  heating: z.any().transform(normalizeHeatingSystem),
  cooling: z.any().transform(normalizeCoolingSystem),
  waterHeating: z.any().transform(normalizeWaterHeatingSystem),
  ventilation: z.any().transform(normalizeVentilationType).optional(),
  windows: z.any().transform(normalizeWindowType),
  renewables: z.any().transform(normalizeRenewableSystem),
  facadeInsulation: z.any().transform(normalizeInsulationLevel).optional(),
  roofInsulation: z.any().transform(normalizeInsulationLevel).optional(),
  budgetRange: z.any().transform(normalizeBudgetRange).optional(),
  timelineHorizon: z.any().transform(normalizeTimelineHorizon).optional(),
  targetLetter: z.any().transform(normalizeEnergyLetter).optional(),
  objective: z.any().transform(normalizeAssessmentObjective).optional(),
  isDemo: z.boolean().optional(),
  // Location
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationSource: z.enum(['catastro', 'manual', 'none']).optional(),
});

const uploadedAttachmentSchema = z.object({
  name: z.string().min(1).max(180),
  type: z.string().min(1).max(120),
  size: z.number().int().positive().max(10 * 1024 * 1024),
  pathname: z.string().min(1).max(500),
  url: z.string().url().optional(),
}).superRefine((attachment, context) => {
  if (!attachment.pathname.startsWith('assessment-drafts/')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Ruta de adjunto no permitida',
      path: ['pathname'],
    });
  }

  if (!isAllowedPhotoAttachment(attachment)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Solo se admiten fotos JPG, PNG y WEBP: ${attachment.name}`,
      path: ['type'],
    });
  }
});

type UploadedAssessmentAttachment = z.infer<typeof uploadedAttachmentSchema>;

async function readRequest(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    const rawData = await req.json();
    return {
      rawData,
      files: [] as File[],
      uploadedAttachments: Array.isArray(rawData.uploadedAttachments) ? rawData.uploadedAttachments : [],
      cadastralData: rawData.cadastralData,
      energyCertificate: rawData.energyCertificate,
      rehabBudget: rawData.rehabBudget,
    };
  }

  const formData = await req.formData();
  const rawData = Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
  );
  const files = formData.getAll('attachments').filter((value): value is File => value instanceof File && value.size > 0);
  const cadastralDataRaw = formData.get('cadastralData');
  const energyCertificateRaw = formData.get('energyCertificate');
  const rehabBudgetRaw = formData.get('rehabBudget');
  let cadastralData = null;
  if (typeof cadastralDataRaw === 'string') {
    try {
      cadastralData = JSON.parse(cadastralDataRaw);
    } catch (e) {
      console.warn('Failed to parse cadastralData from multipart', e);
    }
  }
  let energyCertificate = null;
  if (typeof energyCertificateRaw === 'string') {
    try {
      energyCertificate = JSON.parse(energyCertificateRaw);
    } catch (e) {
      console.warn('Failed to parse energyCertificate from multipart', e);
    }
  }
  let rehabBudget = null;
  if (typeof rehabBudgetRaw === 'string') {
    try {
      rehabBudget = JSON.parse(rehabBudgetRaw);
    } catch (e) {
      console.warn('Failed to parse rehabBudget from multipart', e);
    }
  }
  return { rawData, files, uploadedAttachments: [], cadastralData, energyCertificate, rehabBudget };
}

function validateAttachmentMetadata(files: File[]) {
  const error = validatePhotoAttachments(files);
  if (error) throw new Error(error);
}

function inferAttachmentCategory(file: { name: string; type: string }) {
  if (file.type === 'application/pdf') return 'CEE';
  if (file.type.startsWith('image/')) {
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('ext')) return 'EXTERIOR';
    if (lowerName.includes('int')) return 'INTERIOR';
    return 'EXTERIOR';
  }
  return 'OTHER';
}

async function persistAttachments(assessmentId: string, files: File[]) {
  if (files.length === 0) return [];
  validateAttachmentMetadata(files);

  const ocrStatus = process.env.ENABLE_OCR === 'true' ? 'pending' : 'skipped';

  const attachmentData = [];
  for (const file of files) {
    const stored = await saveAssessmentAttachment(assessmentId, file);

    attachmentData.push({
      assessmentId,
      name: file.name,
      type: file.type || 'application/octet-stream',
      category: inferAttachmentCategory(file),
      size: file.size,
      path: stored.path,
      ocrStatus,
    });
  }
  return attachmentData;
}

function validateUploadedAttachments(rawAttachments: unknown[]) {
  const parsed = z.array(uploadedAttachmentSchema).safeParse(rawAttachments);
  if (!parsed.success) {
    throw new Error('Adjunto subido no válido');
  }

  const error = validatePhotoAttachments(parsed.data);
  if (error) throw new Error(error);

  return parsed.data;
}

function persistUploadedAttachmentMetadata(assessmentId: string, uploadedAttachments: UploadedAssessmentAttachment[]) {
  const ocrStatus = process.env.ENABLE_OCR === 'true' ? 'pending' : 'skipped';

  return uploadedAttachments.map((attachment) => ({
    assessmentId,
    name: attachment.name,
    type: attachment.type,
    category: inferAttachmentCategory(attachment),
    size: attachment.size,
    path: `blob:${attachment.pathname}`,
    ocrStatus,
  }));
}

function serializeAttachment(file: { name: string; type: string; size: number }) {
  return { name: file.name, type: file.type, size: file.size };
}

export async function POST(req: Request) {
  try {
    const session = await auth().catch(() => null);
    const { rawData, files, uploadedAttachments: rawUploadedAttachments, cadastralData: rawCadastralData, energyCertificate: rawEnergyCertificate, rehabBudget: rawRehabBudget } = await readRequest(req);

    const parseResult = assessmentSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: parseResult.error.format() }, { status: 400 });
    }

    const data: PropertyDataV2 = parseResult.data;

    const result = calculateScoreV2(data);
    try {
      validateAttachmentMetadata(files);
    } catch (attachmentError) {
      return NextResponse.json({ error: attachmentError instanceof Error ? attachmentError.message : 'Adjunto no válido' }, { status: 400 });
    }

    let uploadedAttachments: UploadedAssessmentAttachment[] = [];
    try {
      uploadedAttachments = validateUploadedAttachments(rawUploadedAttachments);
    } catch (attachmentError) {
      return NextResponse.json({ error: attachmentError instanceof Error ? attachmentError.message : 'Adjunto no válido' }, { status: 400 });
    }

    let cadastralData = null;
    if (rawCadastralData) {
      const cadParse = CadastralMatchSchema.safeParse(rawCadastralData);
      if (cadParse.success) {
        cadastralData = cadParse.data;
      }
    }

    const energyCertificate = rawEnergyCertificate && typeof rawEnergyCertificate === 'object'
      ? rawEnergyCertificate as EnergyCertificateCEE
      : null;
    const rehabBudget = rawRehabBudget && typeof rawRehabBudget === 'object'
      ? rawRehabBudget as RehabBudgetAnalysis
      : null;

    let assessment;
    try {
      assessment = await prisma.assessment.create({
      data: {
        objective: data.objective,
        userId: session?.user?.id,
        propertyType: data.propertyType,
        orientation: data.orientation,
        roofType: data.roofType,
        year: data.year,
        area: data.area,
        zipcode: data.zipcode,
        heating: data.heating,
        cooling: data.cooling,
        waterHeating: data.waterHeating,
        ventilation: data.ventilation,
        windows: data.windows,
        renewables: data.renewables,
        facadeInsulation: data.facadeInsulation,
        roofInsulation: data.roofInsulation,
        budgetRange: data.budgetRange,
        timelineHorizon: data.timelineHorizon,
        targetLetter: data.targetLetter,
        isDemo: parseResult.data.isDemo || false,
        latitude: data.latitude,
        longitude: data.longitude,
        locationSource: data.locationSource,

        score: result.score,
        estimatedLetter: result.estimatedLetter,
        confidence: result.confidence,
        climateZone: result.climateZone,
        penalties: JSON.stringify(result.penalties),
        strengths: JSON.stringify(result.strengths),
        missingData: JSON.stringify(result.missingData),
        explanation: result.explanation,
        
        cadastralRecord: cadastralData ? {
          create: {
            cadastralReference: cadastralData.cadastralReference,
            province: cadastralData.province,
            municipality: cadastralData.municipality,
            address: cadastralData.address,
            postalCode: cadastralData.postalCode,
            lat: cadastralData.lat,
            lng: cadastralData.lng,
            surfaceBuiltM2: cadastralData.surfaceBuiltM2,
            surfaceDwellingM2: cadastralData.surfaceDwellingM2,
            surfaceCommonM2: cadastralData.surfaceCommonM2,
            surfacePlotM2: cadastralData.surfacePlotM2,
            yearBuilt: cadastralData.yearBuilt,
            
            // New fields
            parcelReference: cadastralData.parcelReference,
            internalBlock: cadastralData.block,
            internalStaircase: cadastralData.staircase,
            internalFloor: cadastralData.floor,
            internalDoor: cadastralData.door,
            propertyUse: cadastralData.propertyUse,
            participationPct: cadastralData.participationCoefficient,

            sourceMode: rawCadastralData.sourceMode || 'rc',
            retrievedAt: new Date(),
          }
        } : undefined
      }
      });
    } catch (databaseError) {
      console.error('Assessment database write failed, using stateless fallback:', databaseError);
      const payload = createStatelessPayload(data, {
        attachments: [...files.map((file, index) => ({
          id: `submitted-${index + 1}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        })), ...uploadedAttachments.map((attachment, index) => ({
          id: `uploaded-${index + 1}`,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
        }))],
        cadastralRecord: cadastralData || undefined,
      });
      return NextResponse.json({
        id: createStatelessAssessmentId(payload),
        estimatedLetter: payload.scoreResult.estimatedLetter,
        confidence: payload.scoreResult.confidence,
        score: payload.scoreResult.score,
        climateZone: payload.scoreResult.climateZone,
        penalties: payload.scoreResult.penalties,
        strengths: payload.scoreResult.strengths,
        missingData: payload.scoreResult.missingData,
        stateless: true,
        attachments: payload.attachments,
      });
    }

    try {
      const attachmentData = [
        ...(await persistAttachments(assessment.id, files)),
        ...persistUploadedAttachmentMetadata(assessment.id, uploadedAttachments),
      ];
      if (attachmentData.length > 0) {
        await prisma.assessmentAttachment.createMany({ data: attachmentData });
      }

      try {
        if (energyCertificate) {
          const createdCertificate = await prisma.energyCertificate.create({
            data: certificateToPrismaCreate({ assessmentId: assessment.id, certificate: energyCertificate }),
          });
          if (energyCertificate.extractedFields?.length) {
            await prisma.dataFieldSource.createMany({
              data: fieldsToPrismaCreateMany(
                assessment.id,
                createdCertificate.id,
                energyCertificate.extractedFields.map((field) => ({ ...field, appliedToWizard: true }))
              ),
            });
          }
        }

        if (rehabBudget) {
          await prisma.rehabBudget.create({
            data: budgetToPrismaCreate({ assessmentId: assessment.id, budget: rehabBudget }) as Prisma.RehabBudgetCreateInput,
          });
        }
      } catch (premiumSourceError) {
        console.warn('Premium source persistence skipped:', premiumSourceError);
      }
    } catch (attachmentError) {
      await prisma.assessment.delete({ where: { id: assessment.id } });
      await Promise.all(uploadedAttachments.map((attachment) => deleteStoredAttachment(`blob:${attachment.pathname}`).catch(() => undefined)));
      return NextResponse.json({ error: attachmentError instanceof Error ? attachmentError.message : 'Adjunto no válido' }, { status: 400 });
    }

    return NextResponse.json({
      id: assessment.id,
      estimatedLetter: result.estimatedLetter,
      confidence: result.confidence,
      score: result.score,
      climateZone: result.climateZone,
      penalties: result.penalties,
      strengths: result.strengths,
      missingData: result.missingData,
      attachments: [
        ...files.map(serializeAttachment),
        ...uploadedAttachments.map(serializeAttachment),
      ]
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}
