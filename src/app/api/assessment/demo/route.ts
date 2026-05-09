import { NextResponse } from 'next/server';
import { getDemoAssessmentPayload } from '@/lib/demo-assets';
import { createStatelessAssessmentId, createStatelessPayload } from '@/lib/stateless-assessment';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const demo = getDemoAssessmentPayload();
  const payload = createStatelessPayload(demo.propertyData, {
    isDemo: demo.isDemo,
    attachments: demo.attachments,
  });

  return NextResponse.redirect(new URL(`/assessment/${createStatelessAssessmentId(payload)}`, req.url));
}
