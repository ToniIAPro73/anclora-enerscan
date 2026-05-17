import sitemap from '@/app/sitemap';
import { calculateSavingsRange, savingsCalculatorSchema } from '@/lib/calculator/savings';
import { citySeoData } from '@/lib/seo/city-data';

describe('seo and calculator', () => {
  it('uses unique city slugs', () => {
    expect(new Set(citySeoData.map((city) => city.slug)).size).toBe(citySeoData.length);
  });

  it('rejects invalid calculator surfaces', () => {
    expect(savingsCalculatorSchema.safeParse({
      propertyType: 'flat',
      area: 1,
      currentLetter: 'E',
      measure: 'windows',
      monthlySpend: 120,
    }).success).toBe(false);
  });

  it('returns ranges rather than guaranteed savings', () => {
    const result = calculateSavingsRange({
      propertyType: 'flat',
      area: 80,
      currentLetter: 'E',
      measure: 'insulation',
      monthlySpend: 150,
    });
    expect(result.annualSavingsRange[0]).toBeLessThan(result.annualSavingsRange[1]);
    expect(result.disclaimer).toContain('no garantizado');
  });

  it('includes new public routes in sitemap', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith('/calculadora-ahorro'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/ciudad/palma'))).toBe(true);
  });
});
