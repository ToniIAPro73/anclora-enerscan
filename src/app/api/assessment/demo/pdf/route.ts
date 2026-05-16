import { NextResponse } from 'next/server';
import { getDemoAssessmentPayload } from '@/lib/demo-assets';
import { createStatelessAssessmentId, createStatelessPayload } from '@/lib/stateless-assessment';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const demo = getDemoAssessmentPayload();
  const payload = createStatelessPayload(demo.propertyData, {
    isDemo: demo.isDemo,
    attachments: demo.attachments,
    publicRef: demo.publicRef,
  });
  const demoId = createStatelessAssessmentId(payload);
  const url = new URL(req.url);
  const pdfUrl = new URL(`/api/assessment/${demoId}/pdf`, req.url);

  for (const key of ['lang', 'currency', 'units']) {
    const value = url.searchParams.get(key);
    if (value) pdfUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(pdfUrl);
}
