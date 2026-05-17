export const BUDGET_REVIEW_PRICE_CENTS = Math.round(Number(process.env.NEXT_PUBLIC_BUDGET_REVIEW_PRICE_EUR || '19.90') * 100);
export const PROVIDER_LEAD_PACK_PRICE_CENTS = Math.round(Number(process.env.NEXT_PUBLIC_PROVIDER_LEAD_PACK_PRICE_EUR || '300') * 100);
export const PROVIDER_LEAD_PACK_CREDITS = Number(process.env.PROVIDER_LEAD_PACK_CREDITS || '10');

export type MonetizationProductType = 'premium_report' | 'budget_review' | 'provider_lead_pack';

export function getProductLegalNotice(language: 'es' | 'en' | 'de' = 'es') {
  if (language === 'en') {
    return 'Indicative estimate based on declared data or supplied documents. It does not replace the official Energy Performance Certificate or a qualified technical review.';
  }
  if (language === 'de') {
    return 'Orientierende Schätzung auf Basis angegebener Daten oder bereitgestellter Dokumente. Sie ersetzt weder den offiziellen Energieausweis noch eine qualifizierte technische Prüfung.';
  }
  return 'Estimación orientativa basada en datos declarados o documentos aportados. No sustituye al Certificado de Eficiencia Energética oficial ni a la revisión de un técnico cualificado.';
}
