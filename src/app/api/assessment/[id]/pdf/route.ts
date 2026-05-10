import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { generateScenarios } from '@/lib/simulator';
import { REGULATORY_TIMELINE } from '@/lib/regulatory';
import { getRelevantSubsidies } from '@/lib/subsidies';
import { renderToStream } from '@react-pdf/renderer';
import { EnerScanReport } from '@/lib/pdf/EnerScanReport';
import { AssessmentAttachment, PremiumReportData, PropertyDataV2, ScoreResultV2, EnergyLetter, PropertyType, HeatingSystem, CoolingSystem, WaterHeatingSystem, WindowType, RenewableSystem, InsulationLevel, BudgetRange, AssessmentObjective, ConfidenceLevel, PropertyOrientation, RoofType, VentilationType, TimelineHorizon } from '@/lib/domain/energy-assessment';
import { normalizeLanguage } from '@/lib/preferences';
import { createReportDataFromPayload, getPublicAssessmentRef, parseStatelessAssessmentId } from '@/lib/stateless-assessment';
import { isBlobAttachmentPath, readAttachmentBytes } from '@/lib/blob-storage';
import React from 'react';
import { appendPdfAnnexes, PdfAnnex } from '@/lib/pdf/append-pdf-annex';
import { getScenarioCostEstimate } from '@/lib/costs/cost-engine';

// Forzar dinamismo para evitar problemas de pre-renderizado con DB y librerías nativas
export const dynamic = 'force-dynamic';

let cachedLogoDataUri: string | undefined;

function isPdfAttachment(attachment: { type: string; name: string }) {
  return attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
}

async function getReportLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  const logoPath = path.join(process.cwd(), 'public', 'brand', 'logo-anclora-energy-scan.png');
  const logo = await readFile(logoPath);
  cachedLogoDataUri = `data:image/png;base64,${logo.toString('base64')}`;
  return cachedLogoDataUri;
}

async function enrichAttachmentsForPdf(
  attachments: AssessmentAttachment[]
) {
  return Promise.all(attachments.map(async (attachment) => {
    if (!attachment.path) return attachment;

    if (attachment.path.startsWith('demo://')) {
      return {
        ...attachment,
        previewText: [
          '# Documentación demo Anclora EnergyScan',
          '',
          'Este archivo simula la documentación aportada por el usuario para ilustrar el anexo del informe premium.',
          '',
          '- Fotografía de fachada: no incluida en esta demo.',
          '- Certificado energético anterior: no aportado.',
          '- Notas del propietario: vivienda adosada de 1988 con cubierta inclinada y calefacción de gas.',
        ].join('\n'),
      };
    }

    try {
      const attachmentPath = path.isAbsolute(attachment.path)
        ? attachment.path
        : path.join(process.cwd(), 'public', attachment.path);
      const file = isBlobAttachmentPath(attachment.path)
        ? (await readAttachmentBytes(attachment.path)).bytes
        : await readFile(attachmentPath);
      
      if (attachment.type.startsWith('image/')) {
        return {
          ...attachment,
          previewDataUri: `data:${attachment.type};base64,${file.toString('base64')}`,
        };
      }

      const lowerName = attachment.name.toLowerCase();
      if (attachment.type.startsWith('text/') || lowerName.endsWith('.md')) {
        return {
          ...attachment,
          previewText: file.toString('utf8').slice(0, 6000),
        };
      }

      // PDFs will be handled by appending them at the end, but we can still provide a note
      if (isPdfAttachment(attachment)) {
        return {
          ...attachment,
          annexNote: `Documento PDF aportado por el usuario. Se adjunta al final del informe en su formato original.`,
        };
      }
    } catch (error) {
      console.error(`Could not read attachment for PDF annex: ${attachment.name}`, error);
      return {
        ...attachment,
        annexNote: 'No se pudo leer el archivo desde el almacenamiento temporal al generar el PDF.',
      };
    }

    return {
      ...attachment,
      annexNote: 'Formato registrado en el expediente. Anclora EnergyScan no convierte ni analiza automáticamente el contenido de este documento.',
    };
  }));
}

async function getAttachmentBytes(attachment: AssessmentAttachment): Promise<Buffer | null> {
  if (!attachment.path) return null;
  try {
    const attachmentPath = path.isAbsolute(attachment.path)
      ? attachment.path
      : path.join(process.cwd(), 'public', attachment.path);
    
    if (isBlobAttachmentPath(attachment.path)) {
      return (await readAttachmentBytes(attachment.path)).bytes;
    } else {
      return await readFile(attachmentPath);
    }
  } catch (error) {
    console.error(`Error reading attachment bytes for ${attachment.name}:`, error);
    return null;
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieLanguage = req.headers.get('cookie')?.match(/enerscan-language=(es|en|de)/)?.[1];
    const language = normalizeLanguage(new URL(req.url).searchParams.get('lang') || cookieLanguage);
    const statelessPayload = parseStatelessAssessmentId(params.id);
    let reportData: PremiumReportData;
    let rawAttachments: AssessmentAttachment[] = [];

    if (statelessPayload) {
      reportData = createReportDataFromPayload(params.id, statelessPayload, language);
      rawAttachments = statelessPayload.attachments || [];
    } else {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.id },
        include: { attachments: true }
      });

      if (!assessment) {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }

      const propertyData: PropertyDataV2 = {
        year: assessment.year,
        area: assessment.area,
        zipcode: assessment.zipcode,
        propertyType: (assessment.propertyType || 'unknown') as PropertyType,
        orientation: (assessment.orientation || 'unknown') as PropertyOrientation,
        roofType: (assessment.roofType || 'unknown') as RoofType,
        heating: (assessment.heating || 'unknown') as HeatingSystem,
        cooling: (assessment.cooling || 'unknown') as CoolingSystem,
        waterHeating: (assessment.waterHeating || 'unknown') as WaterHeatingSystem,
        ventilation: (assessment.ventilation || 'unknown') as VentilationType,
        windows: (assessment.windows || 'unknown') as WindowType,
        renewables: (assessment.renewables || 'unknown') as RenewableSystem,
        facadeInsulation: (assessment.facadeInsulation || 'unknown') as InsulationLevel,
        roofInsulation: (assessment.roofInsulation || 'unknown') as InsulationLevel,
        budgetRange: (assessment.budgetRange || 'unknown') as BudgetRange,
        timelineHorizon: (assessment.timelineHorizon || 'unknown') as TimelineHorizon,
        targetLetter: (assessment.targetLetter || 'G') as EnergyLetter,
        objective: (assessment.objective || 'unknown') as AssessmentObjective,
      };

      const scoreResult: ScoreResultV2 = {
        score: assessment.score || 0,
        estimatedLetter: assessment.estimatedLetter as EnergyLetter,
        confidence: (assessment.confidence || 'Media') as ConfidenceLevel,
        climateZone: assessment.climateZone || 'Desconocida',
        penalties: JSON.parse(assessment.penalties || '[]'),
        strengths: JSON.parse(assessment.strengths || '[]'),
        missingData: JSON.parse(assessment.missingData || '[]'),
        explanation: assessment.explanation || '',
      };

      const rawScenarios = generateScenarios(propertyData, scoreResult);
      const scenarios = rawScenarios.map(s => ({
        ...s,
        costEstimate: getScenarioCostEstimate(s.id, propertyData)
      }));

      rawAttachments = assessment.attachments;

      reportData = {
        id: assessment.id,
        date: new Date(assessment.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : 'en-US'),
        propertyData,
        scoreResult,
        scenarios,
        regulatoryContext: REGULATORY_TIMELINE,
        subsidies: getRelevantSubsidies(propertyData),
        providerCategories: ["aislamiento", "ventanas", "climatización", "acs", "fotovoltaica", "solar térmica", "certificador"],
        attachments: rawAttachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          category: (attachment.category || (attachment.type === 'application/pdf' ? 'CEE' : undefined)) as AssessmentAttachment['category'],
          size: attachment.size,
          path: attachment.path,
          createdAt: attachment.createdAt.toISOString(),
        })),
        language,
        isDemo: assessment.isDemo,
      };
    }

    reportData.attachments = await enrichAttachmentsForPdf(reportData.attachments || []);
    reportData.logoDataUri = await getReportLogoDataUri();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await renderToStream(React.createElement(EnerScanReport, { data: reportData }) as any);
    
    // Convert stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const mainPdfBytes = Buffer.concat(chunks);

    // Find PDF attachments to append
    const pdfAnnexes: PdfAnnex[] = [];
    for (const attachment of rawAttachments) {
      if (isPdfAttachment(attachment)) {
        const bytes = await getAttachmentBytes(attachment);
        if (bytes) {
          pdfAnnexes.push({
            name: attachment.name,
            bytes,
            category: attachment.category
          });
        }
      }
    }

    let finalPdfBytes: Uint8Array = mainPdfBytes;
    if (pdfAnnexes.length > 0) {
      finalPdfBytes = await appendPdfAnnexes(mainPdfBytes, pdfAnnexes);
    }

    const reportRef = reportData.publicRef || getPublicAssessmentRef(params.id);

    return new NextResponse(finalPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="enerscan-informe-${reportRef}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
