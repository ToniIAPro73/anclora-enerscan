import { NextResponse } from 'next/server';
import { demoPropertyData } from '@/lib/demo-assessment';
import { createStatelessAssessmentId, createStatelessPayload } from '@/lib/stateless-assessment';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const payload = createStatelessPayload(demoPropertyData, {
    isDemo: true,
    attachments: [
      {
        id: 'demo-documentacion',
        name: 'demo-documentacion.md',
        type: 'text/markdown',
        size: 1240,
        path: 'demo://documentacion',
      },
    ],
  });

  return NextResponse.redirect(new URL(`/assessment/${createStatelessAssessmentId(payload)}`, req.url));
}
