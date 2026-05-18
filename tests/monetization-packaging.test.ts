import { getDictionary } from '../src/lib/i18n';

describe('pricing packaging Level 1-3', () => {
  describe('Level 1 — Free (ES)', () => {
    const t = getDictionary('es');
    it('has free features list', () => {
      expect(t.pricingFreeFeatures.length).toBeGreaterThan(0);
    });
    it('includes scenario preview mention', () => {
      const hasPreview = t.pricingFreeFeatures.some((f) => f.toLowerCase().includes('previa') || f.toLowerCase().includes('preview') || f.toLowerCase().includes('vorschau'));
      expect(hasPreview).toBe(true);
    });
  });

  describe('Level 2 — Premium (ES)', () => {
    const t = getDictionary('es');
    it('includes evidence matrix in features', () => {
      const hasEvidence = t.pricingPremiumFeatures.some((f) => f.toLowerCase().includes('evidencia') || f.toLowerCase().includes('matriz'));
      expect(hasEvidence).toBe(true);
    });
    it('includes checklist in features', () => {
      const hasChecklist = t.pricingPremiumFeatures.some((f) => f.toLowerCase().includes('checklist') || f.toLowerCase().includes('técnico'));
      expect(hasChecklist).toBe(true);
    });
  });

  describe('Level 2 — Premium (EN)', () => {
    const t = getDictionary('en');
    it('includes evidence matrix in features', () => {
      const hasEvidence = t.pricingPremiumFeatures.some((f) => f.toLowerCase().includes('evidence') || f.toLowerCase().includes('matrix'));
      expect(hasEvidence).toBe(true);
    });
    it('includes checklist in features', () => {
      const hasChecklist = t.pricingPremiumFeatures.some((f) => f.toLowerCase().includes('checklist'));
      expect(hasChecklist).toBe(true);
    });
  });

  describe('Level 2 — Premium (DE)', () => {
    const t = getDictionary('de');
    it('has translated premium features', () => {
      expect(t.pricingPremiumFeatures.length).toBeGreaterThan(0);
    });
    it('all features are strings', () => {
      t.pricingPremiumFeatures.forEach((f) => expect(typeof f).toBe('string'));
    });
  });

  describe('Level 3 — Advanced (ES)', () => {
    const t = getDictionary('es');
    it('title mentions compra/venta or advanced', () => {
      const title = t.pricingProTitle.toLowerCase();
      expect(title.includes('advanced') || title.includes('compra') || title.includes('venta')).toBe(true);
    });
    it('features include condition/risk or estado/riesgo', () => {
      const hasCR = t.pricingProFeatures.some((f) => f.toLowerCase().includes('riesgo') || f.toLowerCase().includes('condition') || f.toLowerCase().includes('estado'));
      expect(hasCR).toBe(true);
    });
    it('is marked as coming soon (no active checkout link)', () => {
      expect(t.pricingProCta.toLowerCase()).toContain('próximamente');
    });
  });

  describe('Level 3 — Advanced (EN)', () => {
    const t = getDictionary('en');
    it('is marked as coming soon', () => {
      expect(t.pricingProCta.toLowerCase()).toContain('coming');
    });
    it('features include accessibility or risk', () => {
      const hasSomething = t.pricingProFeatures.some((f) => f.toLowerCase().includes('risk') || f.toLowerCase().includes('access'));
      expect(hasSomething).toBe(true);
    });
  });

  describe('Level 3 — Advanced (DE)', () => {
    const t = getDictionary('de');
    it('has DE pro features', () => {
      expect(t.pricingProFeatures.length).toBeGreaterThan(0);
    });
    it('is marked as coming soon in DE', () => {
      expect(t.pricingProCta.toLowerCase()).toContain('demnächst');
    });
  });
});
