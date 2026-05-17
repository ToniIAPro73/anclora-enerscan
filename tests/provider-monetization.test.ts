import { scoreProviderMatch } from '@/lib/domain/partners';
import { getPartnerLanding } from '@/lib/partners/partner-landing';

describe('provider monetization helpers', () => {
  it('ranks verified local category matches higher', () => {
    const high = scoreProviderMatch({
      categories: ['HVAC'],
      zones: ['Mallorca'],
      status: 'PREFERRED',
      verified: true,
      rating: 4.8,
    }, { category: 'HVAC', zone: 'Palma Mallorca' });
    const low = scoreProviderMatch({
      categories: ['SOLAR'],
      zones: ['Madrid'],
      status: 'PENDING',
      verified: false,
      rating: 3,
    }, { category: 'HVAC', zone: 'Palma Mallorca' });
    expect(high).toBeGreaterThan(low);
  });

  it('provides demo partner attribution landing data', () => {
    expect(getPartnerLanding('demo-aerotermia-mallorca')?.category).toBe('HVAC');
    expect(getPartnerLanding('missing')).toBeUndefined();
  });
});
