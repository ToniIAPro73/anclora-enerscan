import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readAttachmentBytes } from '@/lib/blob-storage';
import { extractTextFromPdf } from '@/lib/ocr/pdf-extractor';
import { parseBudgetAnalysisText } from '@/lib/ocr/budget-parser';
import { budgetToPrismaCreate } from '@/lib/ingestion/persistence';
import type { EnergyLetter } from '@/lib/ingestion/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const attachmentId = typeof body.attachmentId === 'string' ? body.attachmentId : undefined;
    if (!attachmentId) return NextResponse.json({ error: 'attachmentId requerido' }, { status: 400 });

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: { energyCertificates: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

    const attachment = await prisma.assessmentAttachment.findFirst({
      where: { id: attachmentId, assessmentId: params.id },
    });
    if (!attachment) return NextResponse.json({ error: 'Adjunto no encontrado' }, { status: 404 });
    if (attachment.type !== 'application/pdf' && !attachment.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'El adjunto debe ser un PDF' }, { status: 400 });
    }

    const currentCertificate = assessment.energyCertificates[0];
    const { bytes } = await readAttachmentBytes(attachment.path);
    const { fullText } = await extractTextFromPdf(new Uint8Array(bytes));
    const budget = parseBudgetAnalysisText(fullText, {
      currentLetter: (currentCertificate?.globalLetter || assessment.estimatedLetter) as EnergyLetter | undefined,
      targetLetter: (body.targetLetter || assessment.targetLetter) as EnergyLetter | undefined,
      currentNonRenewableEP: currentCertificate?.nonRenewableEPKwhM2Year || undefined,
      currentEmissions: currentCertificate?.emissionsKgCO2M2Year || undefined,
      usefulAreaM2: currentCertificate?.usefulAreaM2 || assessment.area,
      propertyType: assessment.propertyType || undefined,
      climateZone: currentCertificate?.climateZone || assessment.climateZone || undefined,
    });
    const created = await prisma.rehabBudget.create({
      data: budgetToPrismaCreate({ assessmentId: params.id, attachmentId, budget }),
    });
    await prisma.assessmentAttachment.update({
      where: { id: attachmentId },
      data: {
        ocrStatus: 'done',
        ocrData: { sourceKind: 'budget_pdf', extracted: { normalizedAnalysis: budget }, processedAt: new Date().toISOString() },
        ocrProcessedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, budget: { ...budget, id: created.id }, warnings: budget.warnings });
  } catch (error) {
    console.error('Budget import failed:', error);
    return NextResponse.json({ error: 'Failed to import budget' }, { status: 500 });
  }
}
