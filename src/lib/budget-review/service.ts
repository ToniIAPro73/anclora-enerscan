import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { parseBudgetAnalysisText } from '@/lib/ocr/budget-parser';
import type { BudgetLineItem } from '@/lib/ingestion/types';

export function hashBudgetText(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

export function buildBudgetReviewFindings(lineItems: BudgetLineItem[], totalAmount?: number) {
  const findings = lineItems.map((item) => {
    const unitPrice = item.unitPrice || (item.total && item.quantity ? item.total / item.quantity : undefined);
    const high = unitPrice !== undefined && unitPrice > 450;
    const low = unitPrice !== undefined && unitPrice < 25;
    return {
      description: item.description,
      total: item.total,
      unitPrice,
      status: high ? 'HIGH_REVIEW' : low ? 'LOW_REVIEW' : 'IN_RANGE',
      message: high
        ? 'Partida con precio unitario elevado. Conviene pedir desglose tecnico.'
        : low
          ? 'Partida con precio unitario bajo. Revisa alcance, calidades y mediciones.'
          : 'Partida dentro de un rango orientativo amplio.',
    };
  });

  return {
    findings,
    alert: totalAmount && totalAmount > 30000
      ? 'Presupuesto alto: revisa mediciones, exclusiones, IVA y garantías antes de aceptar.'
      : 'Revisa siempre mediciones, marcas, garantías e IVA antes de aceptar.',
    legalNotice: 'Análisis automático orientativo. No sustituye la revisión de un técnico, arquitecto, aparejador ni asesor legal.',
  };
}

export async function createBudgetReviewFromText(input: {
  text: string;
  source?: string;
  fileName?: string;
  userId?: string;
}) {
  const analysis = parseBudgetAnalysisText(input.text);
  const reviewFindings = buildBudgetReviewFindings(analysis.lineItems, analysis.totalAmount);
  const totalAmountCents = analysis.totalAmount ? Math.round(analysis.totalAmount * 100) : undefined;

  return prisma.budgetReview.create({
    data: {
      userId: input.userId,
      source: input.source || 'text',
      fileName: input.fileName,
      rawTextHash: hashBudgetText(input.text),
      status: 'ANALYZED',
      extractionConfidence: analysis.extractionConfidence,
      totalAmountCents,
      currency: analysis.currency || 'EUR',
      summaryJson: {
        detectedItems: analysis.lineItems.length,
        detectedMeasures: analysis.detectedMeasures.length,
        totalAmount: analysis.totalAmount,
        confidence: analysis.extractionConfidence,
        alert: reviewFindings.alert,
      },
      lineItemsJson: analysis.lineItems,
      findingsJson: reviewFindings,
    },
  });
}
