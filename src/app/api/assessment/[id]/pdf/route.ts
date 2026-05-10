import { NextResponse } from 'next/server';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
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

// Forzar dinamismo para evitar problemas de pre-renderizado con DB y librerías nativas
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
let cachedLogoDataUri: string | undefined;

function isPdfAttachment(attachment: AssessmentAttachment) {
  return attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
}

function isCeeAttachment(attachment: AssessmentAttachment) {
  return attachment.category === 'CEE' || isPdfAttachment(attachment);
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

      if (isPdfAttachment(attachment)) {
        const ceePagePreviews = await renderPdfBytesToDataUris(file);
        return {
          ...attachment,
          category: isCeeAttachment(attachment) ? 'CEE' : attachment.category,
          ceePagePreviews,
          annexNote: `Supuesto CEE aportado por el usuario. Letra recogida en el documento demo: ${attachment.ceeLetter || 'E'}. Documento demo sin validez oficial ni administrativa.`,
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

async function renderPdfBytesToDataUris(pdfBytes: Buffer): Promise<string[]> {
  try {
    // Importación dinámica para evitar problemas con librerías nativas en el arranque
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('@napi-rs/canvas');

    const loadingTask = getDocument({ 
      data: new Uint8Array(pdfBytes),
      useWorkerFetch: false,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const dataUris: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.8 });
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        canvas: canvas as unknown as HTMLCanvasElement,
        viewport,
      }).promise;
      
      const pngBuffer = await canvas.encode('png');
      dataUris.push(`data:image/png;base64,${pngBuffer.toString('base64')}`);
    }
    
    if (dataUris.length === numPages) return dataUris;
    return await renderPdfBytesWithPdftoppm(pdfBytes);
  } catch (error) {
    console.error('PDF to Image conversion failed:', error);
    return await renderPdfBytesWithPdftoppm(pdfBytes);
  }
}

async function renderPdfBytesWithPdftoppm(pdfBytes: Buffer): Promise<string[]> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'energyscan-cee-pages-'));
  const pdfPath = path.join(tempDir, 'source.pdf');
  const outputPrefix = path.join(tempDir, 'page');

  try {
    await writeFile(pdfPath, pdfBytes);
    await execFileAsync('pdftoppm', ['-png', '-r', '180', pdfPath, outputPrefix]);
    const files = (await readdir(tempDir))
      .filter((file) => /^page-\d+\.png$/.test(file))
      .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));

    return await Promise.all(files.map(async (file) => {
      const image = await readFile(path.join(tempDir, file));
      return `data:image/png;base64,${image.toString('base64')}`;
    }));
  } catch (error) {
    console.error('pdftoppm PDF conversion failed:', error);
    return [];
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieLanguage = req.headers.get('cookie')?.match(/enerscan-language=(es|en|de)/)?.[1];
    const language = normalizeLanguage(new URL(req.url).searchParams.get('lang') || cookieLanguage);
    const statelessPayload = parseStatelessAssessmentId(params.id);
    let reportData: PremiumReportData;

    if (statelessPayload) {
      reportData = createReportDataFromPayload(params.id, statelessPayload, language);
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

      const scenarios = generateScenarios(propertyData, scoreResult);

      reportData = {
        id: assessment.id,
        date: new Date(assessment.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : 'en-US'),
        propertyData,
        scoreResult,
        scenarios,
        regulatoryContext: REGULATORY_TIMELINE,
        subsidies: getRelevantSubsidies(propertyData),
        providerCategories: ["aislamiento", "ventanas", "climatización", "acs", "fotovoltaica", "solar térmica", "certificador"],
        attachments: assessment.attachments.map((attachment) => ({
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

    // Need to cast stream to unknown then ResponseBody because the typings for React PDF Stream can be incomplete in Next
    const reportRef = reportData.publicRef || getPublicAssessmentRef(params.id);

    return new NextResponse(stream as unknown as ReadableStream, {
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
