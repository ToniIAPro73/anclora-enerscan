import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { createBudgetReviewFromText } from '@/lib/budget-review/service';
import { trackEvent } from '@/lib/analytics';
import { extractTextFromPdf } from '@/lib/ocr/pdf-extractor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z.object({
  text: z.string().trim().min(40).max(80_000),
});

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  let parsedInput: { text: string; source: string; fileName?: string };

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null);
    const file = formData?.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'budget_pdf_required' }, { status: 400 });
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ ok: false, error: 'budget_pdf_invalid_type' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'budget_pdf_too_large' }, { status: 400 });
    }
    const extracted = await extractTextFromPdf(new Uint8Array(await file.arrayBuffer()));
    const parsed = schema.safeParse({ text: extracted.fullText });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'budget_pdf_text_invalid' }, { status: 400 });
    }
    parsedInput = { text: parsed.data.text, source: 'pdf', fileName: file.name };
  } else {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'budget_text_invalid' }, { status: 400 });
    }
    parsedInput = { text: parsed.data.text, source: 'text' };
  }

  const session = await auth().catch(() => null);
  const review = await createBudgetReviewFromText({
    text: parsedInput.text,
    userId: session?.user?.id,
    source: parsedInput.source,
    fileName: parsedInput.fileName,
  });

  trackEvent('budget_review_started', { productType: 'budget_review', budgetReviewId: review.id, source: parsedInput.source });
  return NextResponse.json({
    ok: true,
    review: {
      id: review.id,
      status: review.status,
      summary: review.summaryJson,
      paid: Boolean(review.paidAt),
    },
  });
}
