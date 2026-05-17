import { buildAssessmentPdfResponse } from '@/lib/assessment-pdf-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return buildAssessmentPdfResponse(req, params.id);
}
