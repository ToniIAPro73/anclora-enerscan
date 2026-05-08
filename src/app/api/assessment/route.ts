import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScoreV2 } from '@/lib/scoring';
import { z } from 'zod';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { PropertyDataV2 } from '@/lib/domain/energy-assessment';
import { isAllowedAttachment, MAX_ATTACHMENTS, MAX_ATTACHMENT_SIZE, sanitizeFilename } from '@/lib/attachments';
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
});

async function readRequest(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return { rawData: await req.json(), files: [] as File[] };
  }

  const formData = await req.formData();
  const rawData = Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
  );
  const files = formData.getAll('attachments').filter((value): value is File => value instanceof File && value.size > 0);
  return { rawData, files };
}

async function persistAttachments(assessmentId: string, files: File[]) {
  if (files.length === 0) return [];
  if (files.length > MAX_ATTACHMENTS) {
    throw new Error(`Máximo ${MAX_ATTACHMENTS} adjuntos por valoración`);
  }

  const uploadDir = path.join(process.cwd(), 'uploads', 'assessments', assessmentId);
  await mkdir(uploadDir, { recursive: true });

  const attachmentData = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`El archivo ${file.name} supera el límite de 8 MB`);
    }
    if (!isAllowedAttachment(file)) {
      throw new Error(`Tipo de archivo no admitido: ${file.name}`);
    }
    const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
    const absolutePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);
    attachmentData.push({
      assessmentId,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      path: absolutePath,
    });
  }
  return attachmentData;
}

export async function POST(req: Request) {
  try {
    const { rawData, files } = await readRequest(req);

    const parseResult = assessmentSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: parseResult.error.format() }, { status: 400 });
    }

    const data: PropertyDataV2 = parseResult.data;

    const result = calculateScoreV2(data);

    const assessment = await prisma.assessment.create({
      data: {
        objective: data.objective,
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

        score: result.score,
        estimatedLetter: result.estimatedLetter,
        confidence: result.confidence,
        climateZone: result.climateZone,
        penalties: JSON.stringify(result.penalties),
        strengths: JSON.stringify(result.strengths),
        missingData: JSON.stringify(result.missingData),
        explanation: result.explanation
      }
    });

    try {
      const attachmentData = await persistAttachments(assessment.id, files);
      if (attachmentData.length > 0) {
        await prisma.assessmentAttachment.createMany({ data: attachmentData });
      }
    } catch (attachmentError) {
      await prisma.assessment.delete({ where: { id: assessment.id } });
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
      attachments: files.map((file) => ({ name: file.name, type: file.type, size: file.size }))
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}
