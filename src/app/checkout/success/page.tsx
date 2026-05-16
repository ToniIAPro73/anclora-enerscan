import { CheckoutSuccessClient } from '@/components/CheckoutSuccessClient';

export const dynamic = 'force-dynamic';

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; assessment_id?: string };
}) {
  return (
    <CheckoutSuccessClient
      sessionId={searchParams.session_id}
      assessmentId={searchParams.assessment_id}
    />
  );
}
