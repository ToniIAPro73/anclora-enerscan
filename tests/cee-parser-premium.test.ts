import {
  detectCertificateProgram,
  parseCeeToCertificate,
  parseEmissions,
  parseEnergyIntensity,
  parseEnergyLetter,
  parseSpanishNumber,
} from '@/lib/ocr/cee-parser';

describe('premium CEE parser', () => {
  const sample = `
    Certificado de eficiencia energética generado con CE3X.
    Dirección: Calle Mayor 1, 28013 Madrid.
    Referencia catastral: 1234567AB1234C0001DE.
    Zona climática: D3. Uso del edificio: Residencial vivienda.
    Año de construcción: 2003. Superficie útil habitable (m²): 52,40.
    Fecha de emisión: 13/05/2026.
    Consumo de energía primaria no renovable [kWh/m² año] 145,5 E.
    Emisiones de dióxido de carbono [kgCO2/m² año] 32,1 D.
    Recomendación 1: Sustitución de ventanas por doble acristalamiento bajo emisivo.
  `;

  it('parses Spanish numeric values', () => {
    expect(parseSpanishNumber('18.450,00 €')).toBe(18450);
    expect(parseEnergyIntensity('145,5 kWh/m² año')).toBe(145.5);
    expect(parseEmissions('32,1 kgCO2/m² año')).toBe(32.1);
  });

  it('detects program and energy letter', () => {
    expect(detectCertificateProgram(sample)).toBe('CE3X');
    expect(parseEnergyLetter(sample)).toBe('E');
  });

  it('builds normalized certificate with extracted fields', () => {
    const certificate = parseCeeToCertificate(sample);
    expect(certificate.extractionStatus).toBe('PARSED');
    expect(certificate.globalLetter).toBe('E');
    expect(certificate.nonRenewableEPKwhM2Year).toBe(145.5);
    expect(certificate.emissionsKgCO2M2Year).toBe(32.1);
    expect(certificate.usefulAreaM2).toBe(52.4);
    expect(certificate.yearBuilt).toBe(2003);
    expect(certificate.climateZone).toBe('D3');
    expect(certificate.recommendations?.[0].rawText).toMatch(/ventanas/i);
    expect(certificate.extractedFields?.some((field) => field.fieldName === 'area')).toBe(true);
  });

  it('marks partial documents as needing review', () => {
    const certificate = parseCeeToCertificate('Certificado de eficiencia energética sin datos suficientes');
    expect(certificate.extractionStatus).toBe('NEEDS_REVIEW');
  });
});
