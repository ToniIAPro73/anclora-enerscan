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
    expect(parseSpanishNumber('126.8 kWh/m² año')).toBe(126.8);
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

  it('extracts CEX annex data with habitable area and detailed sections', () => {
    const certificate = parseCeeToCertificate(`
      CALIFICACIÓN ENERGÉTICA OBTENIDA:
      CONSUMO DE ENERGÍA EMISIONES DE DIÓXIDO DE PRIMARIA NO RENOVABLE CARBONO [kWh/m² año] [kgCO2/ m² año]
      A < 37.1 B 37.1-60.1 C 60.1-93.2 126.8 D D 93.2-143.3
      A < 8.4 B 8.4-13.6 C 13.6-21.1 24.8 D D 21.1-32.4
      Superficie habitable [m²] 49.0
      F A 01 Fachada 13.38 1.69 Estimadas
      VB 1 DORMITORIO Hueco 4.32 3.78 0.61 Estimado Estimado
      Emisiones globales [kgCO2/m² año] Emisiones refrigeración [kgCO2/m² año] D Emisiones iluminación [kgCO2/m² año] - 3.87 -
      Energía primaria calefacción [kWh/m²año] C Energía primaria ACS [kWh/m² año] G 63.29 40.65
      DEMANDA DE CALEFACCIÓN DEMANDA DE REFRIGERACIÓN A < 11.7 B 11.7-27.0 42.5 C C 27.0-48.7 A < 5.5 B 5.5-8.9 C 8.9-13.9 18.5 D D 13.9-21.3
      DESCRIPCIÓN DE LA MEDIDA DE MEJORA Características de la medida (modelo de equipos, materiales, parámetros característicos ) Panel fotovoltáico Coste estimado de la medida 670.0 €
    `);

    expect(certificate.usefulAreaM2).toBe(49);
    expect(certificate.nonRenewableEPKwhM2Year).toBe(126.8);
    expect(certificate.emissionsKgCO2M2Year).toBe(24.8);
    expect(certificate.extractedSections?.envelope?.opaqueElements).toHaveLength(1);
    expect(certificate.extractedSections?.envelope?.openings).toHaveLength(1);
    expect(certificate.extractedSections?.indicators?.primaryEnergy?.heating?.value).toBe(63.29);
    expect(certificate.extractedSections?.indicators?.demand?.cooling?.value).toBe(18.5);
    expect(certificate.extractedSections?.improvementMeasures?.[0].costEstimateEur).toBe(670);
  });
});
