export type PremiumAccessState = {
  isPaid: boolean;
  isDemo: boolean;
  isStateless: boolean;
  reason?: 'paid' | 'demo' | 'stateless-demo' | 'unpaid';
};

export function canAccessPremiumContent(input: {
  paidAt?: Date | string | null;
  isPremium?: boolean | null;
  isDemo?: boolean | null;
  statelessPayload?: unknown;
}): PremiumAccessState {
  const isDemo = input.isDemo === true;
  const isStateless = Boolean(input.statelessPayload);
  const demoPremiumEnabled = process.env.ENABLE_DEMO_PREMIUM === 'true';

  if (input.paidAt) {
    return { isPaid: true, isDemo, isStateless, reason: 'paid' };
  }

  if (isDemo && demoPremiumEnabled) {
    return { isPaid: true, isDemo: true, isStateless, reason: isStateless ? 'stateless-demo' : 'demo' };
  }

  return { isPaid: false, isDemo, isStateless, reason: 'unpaid' };
}

export function assertCanDownloadPremiumPdf(input: PremiumAccessState): boolean {
  return input.isPaid === true;
}
