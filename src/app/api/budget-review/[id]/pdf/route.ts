import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { BudgetReviewReport } from '@/lib/pdf/BudgetReviewReport';
import { normalizeLanguage } from '@/lib/preferences';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import type { BudgetLineItem } from '@/lib/ingestion/types';
import React from 'react';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const review = await prisma.budgetReview.findUnique({ where: { id: params.id } });

  if (!review) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!review.paidAt) {
    return NextResponse.json({ error: 'payment_required', checkoutRequired: true }, { status: 402 });
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const cookieLang = cookieHeader.match(/enerscan-language=(es|en|de)/)?.[1];
  const url = new URL(req.url);
  const language = normalizeLanguage(url.searchParams.get('lang') || cookieLang);
  const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'es-ES';

  const lineItems = Array.isArray(review.lineItemsJson) ? review.lineItemsJson as BudgetLineItem[] : [];
  const summaryJson = review.summaryJson as { totalAmount?: number; confidence?: number } | null;

  const reportData = {
    id: review.id,
    date: review.createdAt.toLocaleDateString(locale),
    fileName: review.fileName ?? undefined,
    totalAmount: summaryJson?.totalAmount ?? (review.totalAmountCents ? review.totalAmountCents / 100 : undefined),
    currency: review.currency || 'EUR',
    extractionConfidence: review.extractionConfidence ?? undefined,
    lineItems,
    language,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await renderToStream(React.createElement(BudgetReviewReport, { data: reportData }) as any);
  const chunks: Uint8Array[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const chunk of stream as any) chunks.push(chunk);
  const pdfBytes = Buffer.concat(chunks);

  const t = getMonetizationCopy(language).budgetReview;
  const filename = `${t.pdfFilename}-${review.id.slice(0, 8)}.pdf`;

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
