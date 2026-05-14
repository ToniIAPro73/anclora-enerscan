import crypto from 'crypto';
import type { CeeData } from './types';
import type {
  CeeEnergyMetric,
  CeeExtractedSections,
  CeePartialMetric,
  CeeThermalSystem,
  EnergyCertificateCEE,
  EnergyLetter,
  ExtractedField,
} from '@/lib/ingestion/types';

export function parseSpanishNumber(value: string): number | undefined {
  if (!value) return undefined;
  const firstNumber = value.match(/-?\d[\d.]*,\d+|-?\d[\d,]*\.\d+|-?\d+/);
  if (!firstNumber) return undefined;
  const raw = firstNumber[0].replace(/\s/g, '');
  const normalized = raw.includes(',')
    ? raw.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.').replace(/[^\d.-]/g, '')
    : raw.replace(/,(?=\d{3}(?:\D|$))/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseAreaM2(value: string): number | undefined {
  return parseSpanishNumber(value);
}

export function parseEnergyIntensity(value: string): number | undefined {
  return parseSpanishNumber(value);
}

export function parseEmissions(value: string): number | undefined {
  return parseSpanishNumber(value);
}

export function parseEnergyLetter(text: string): EnergyLetter | undefined {
  const cleanText = text.replace(/\s+/g, ' ');
  const patterns = [
    /calificaci[oó]n\s+energ[eé]tica(?:\s+del\s+edificio)?(?:\s+en\s+consumo)?\s*[:\-]?\s*([A-G])/i,
    /consumo\s+de\s+energ[ií]a\s+primaria\s+no\s+renovable[\s\S]{0,90}?([A-G])(?:\s|$)/i,
    /\bletra\s+([A-G])\b/i,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) return match[1].toUpperCase() as EnergyLetter;
  }
  return undefined;
}

export function detectCertificateProgram(text: string): EnergyCertificateCEE['sourceProgram'] {
  if (/CE3X|CE3Xv|CEX/i.test(text)) return 'CE3X';
  if (/HULC|herramienta\s+unificada/i.test(text)) return 'HULC';
  if (/CERMA/i.test(text)) return 'CERMA';
  return 'UNKNOWN';
}

function parseDate(value: string): string | undefined {
  const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return undefined;
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

function confidenceForCertificate(certificate: Partial<EnergyCertificateCEE>, hasNativeAnchors = true) {
  const fields = [
    certificate.globalLetter,
    certificate.nonRenewableEPKwhM2Year,
    certificate.emissionsKgCO2M2Year,
    certificate.usefulAreaM2,
    certificate.yearBuilt,
  ].filter((value) => value !== undefined).length;
  const base = hasNativeAnchors ? 0.35 : 0.2;
  return Math.min(0.95, base + fields * 0.12);
}

function extractedField<T>(
  fieldName: string,
  value: T | undefined,
  confidence: number,
  requiresReview = false
): ExtractedField<T>[] {
  if (value === undefined || value === null || value === '') return [];
  return [{
    fieldName,
    value,
    sourceType: 'CEE',
    sourceLabel: 'CEE PDF',
    confidence,
    requiresReview,
  }];
}

function metric(value: number | undefined, letter: EnergyLetter | undefined, unit: string): CeeEnergyMetric | undefined {
  if (value === undefined && !letter) return undefined;
  return { value, letter, unit };
}

function parseLetter(value: string | undefined): EnergyLetter | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-G]$/.test(normalized) ? normalized as EnergyLetter : undefined;
}

function parseFirstGlobalRatings(text: string) {
  const match = text.match(
    /CALIFICACI[ÓO]N\s+ENERG[ÉE]TICA\s+OBTENIDA:[\s\S]{0,900}?C\s+\d{1,4}(?:[.,]\d+)?-\d{1,4}(?:[.,]\d+)?\s+(\d{1,4}(?:[.,]\d+)?)\s+([A-G])\s+\2[\s\S]{0,280}?C\s+\d{1,4}(?:[.,]\d+)?-\d{1,4}(?:[.,]\d+)?\s+(\d{1,4}(?:[.,]\d+)?)\s+([A-G])\s+\4/i
  );
  if (!match) return {};
  return {
    primaryEnergy: parseEnergyIntensity(match[1]),
    primaryLetter: parseLetter(match[2]),
    emissions: parseEmissions(match[3]),
    emissionsLetter: parseLetter(match[4]),
  };
}

function parseEnergySections(text: string): CeeExtractedSections['indicators'] {
  const emissionsHeatingAcs = text.match(/Emisiones\s+calefacci[oó]n\s+\[kgCO2\/m²\s+año\]\s+([A-G])\s+Emisiones\s+ACS\s+\[kgCO2\/m²\s+año\]\s+([A-G])\s+(\d{1,4}(?:[.,]\d+)?)\s+(\d{1,4}(?:[.,]\d+)?)/i);
  const emissionsCooling = text.match(/Emisiones\s+globales\s+\[kgCO2\/m²\s+año\]\s+Emisiones\s+refrigeraci[oó]n\s+\[kgCO2\/m²\s+año\]\s+([A-G])\s+Emisiones\s+iluminaci[oó]n[\s\S]{0,80}?-\s+(\d{1,4}(?:[.,]\d+)?)/i);
  const emissionsGlobal = text.match(/INDICADOR\s+GLOBAL[\s\S]{0,220}?C\s+\d{1,4}(?:[.,]\d+)?-\d{1,4}(?:[.,]\d+)?\s+(\d{1,4}(?:[.,]\d+)?)\s+([A-G])\s+\2/i);

  const primaryHeatingAcs = text.match(/Energ[ií]a\s+primaria\s+calefacci[oó]n\s+\[kWh\/m²año\]\s+([A-G])\s+Energ[ií]a\s+primaria\s+ACS\s+\[kWh\/m²\s+año\]\s+([A-G])\s+(\d{1,4}(?:[.,]\d+)?)\s+(\d{1,4}(?:[.,]\d+)?)/i);
  const primaryCooling = text.match(/Consumo\s+global\s+de\s+energ[ií]a\s+primaria\s+no\s+renovable\s+\[kWh\/m²\s+año\]\s+Energ[ií]a\s+primaria\s+refrigeraci[oó]n\s+\[kWh\/m²\s+año\]\s+([A-G])[\s\S]{0,120}?(\d{1,4}(?:[.,]\d+)?)/i);
  const primaryGlobal = text.match(/2\.\s+CALIFICACI[ÓO]N\s+ENERG[ÉE]TICA[\s\S]{0,500}?C\s+\d{1,4}(?:[.,]\d+)?-\d{1,4}(?:[.,]\d+)?\s+(\d{1,4}(?:[.,]\d+)?)\s+([A-G])\s+\2/i);

  const demand = text.match(/DEMANDA\s+DE\s+CALEFACCI[ÓO]N\s+DEMANDA\s+DE\s+REFRIGERACI[ÓO]N[\s\S]{0,220}?(\d{1,4}(?:[.,]\d+)?)\s+([A-G])\s+\2[\s\S]{0,220}?(\d{1,4}(?:[.,]\d+)?)\s+([A-G])\s+\4/i);

  const indicators: CeeExtractedSections['indicators'] = {};
  const emissions: CeePartialMetric = {
    total: metric(parseEmissions(emissionsGlobal?.[1] || ''), parseLetter(emissionsGlobal?.[2]), 'kgCO2/m² año'),
    heating: metric(parseEmissions(emissionsHeatingAcs?.[3] || ''), parseLetter(emissionsHeatingAcs?.[1]), 'kgCO2/m² año'),
    dhw: metric(parseEmissions(emissionsHeatingAcs?.[4] || ''), parseLetter(emissionsHeatingAcs?.[2]), 'kgCO2/m² año'),
    cooling: metric(parseEmissions(emissionsCooling?.[2] || ''), parseLetter(emissionsCooling?.[1]), 'kgCO2/m² año'),
  };
  const primaryEnergy: CeePartialMetric = {
    total: metric(parseEnergyIntensity(primaryGlobal?.[1] || ''), parseLetter(primaryGlobal?.[2]), 'kWh/m² año'),
    heating: metric(parseEnergyIntensity(primaryHeatingAcs?.[3] || ''), parseLetter(primaryHeatingAcs?.[1]), 'kWh/m² año'),
    dhw: metric(parseEnergyIntensity(primaryHeatingAcs?.[4] || ''), parseLetter(primaryHeatingAcs?.[2]), 'kWh/m² año'),
    cooling: metric(parseEnergyIntensity(primaryCooling?.[2] || ''), parseLetter(primaryCooling?.[1]), 'kWh/m² año'),
  };
  const demandMetrics: CeePartialMetric = {
    heating: metric(parseEnergyIntensity(demand?.[1] || ''), parseLetter(demand?.[2]), 'kWh/m² año'),
    cooling: metric(parseEnergyIntensity(demand?.[3] || ''), parseLetter(demand?.[4]), 'kWh/m² año'),
  };

  if (Object.values(emissions).some(Boolean)) indicators.emissions = emissions;
  if (Object.values(primaryEnergy).some(Boolean)) indicators.primaryEnergy = primaryEnergy;
  if (Object.values(demandMetrics).some(Boolean)) indicators.demand = demandMetrics;
  return indicators;
}

function parseEnvelopeSections(text: string): CeeExtractedSections['envelope'] {
  const opaqueElements = Array.from(text.matchAll(/\b([A-Z]\s+[A-Z]\s+\d{2})\s+(Fachada|Cubierta|Suelo|Medianera)\s+(\d{1,4}(?:[.,]\d+)?)\s+(\d{1,3}(?:[.,]\d+)?)\s+(Estimad[ao]s?|Conocid[ao]s?)/gi))
    .map((match) => ({
      name: match[1].replace(/\s+/g, ' '),
      type: match[2],
      areaM2: parseAreaM2(match[3]),
      transmittanceWm2K: parseSpanishNumber(match[4]),
      source: match[5],
    }));

  const openings = Array.from(text.matchAll(/\b([A-Z]{1,2}\s+\d+\s+[A-ZÁÉÍÓÚÑ ]{3,30})\s+Hueco\s+(\d{1,4}(?:[.,]\d+)?)\s+(\d{1,3}(?:[.,]\d+)?)\s+(\d{1,2}(?:[.,]\d+)?)\s+(Estimad[ao]s?)\s+(Estimad[ao]s?)/gi))
    .slice(0, 20)
    .map((match) => ({
      name: match[1].replace(/\s+/g, ' ').trim(),
      type: 'Hueco',
      areaM2: parseAreaM2(match[2]),
      transmittanceWm2K: parseSpanishNumber(match[3]),
      solarFactor: parseSpanishNumber(match[4]),
      source: `${match[5]} / ${match[6]}`,
    }));

  return opaqueElements.length > 0 || openings.length > 0 ? { opaqueElements, openings } : undefined;
}

function parseThermalSystems(text: string): CeeThermalSystem[] | undefined {
  const systems: CeeThermalSystem[] = [];
  const heatPump = text.match(/Calefacci[oó]n\s+y\s+refrigeraci[oó]n\s+(Bomba\s+de\s+Calor[^0-9]+)\s+(\d{1,4}(?:[.,]\d+)?)\s+Electricidad\s+(Estimad[ao])/i);
  if (heatPump) {
    systems.push({
      section: 'HEATING',
      name: 'Calefacción y refrigeración',
      type: heatPump[1].trim(),
      seasonalEfficiencyPct: parseSpanishNumber(heatPump[2]),
      energyType: 'Electricidad',
      source: heatPump[3],
    });
    systems.push({
      section: 'COOLING',
      name: 'Calefacción y refrigeración',
      type: heatPump[1].trim(),
      seasonalEfficiencyPct: parseSpanishNumber(heatPump[2]),
      energyType: 'Electricidad',
      source: heatPump[3],
    });
  }
  const boiler = text.match(/Calefacci[oó]n\s+y\s+ACS\s+(Caldera\s+Est[aá]ndar)\s+(\d{1,4}(?:[.,]\d+)?)\s+(\d{1,4}(?:[.,]\d+)?)\s+Gas\s+Natural\s+(Estimad[ao])/i);
  if (boiler) {
    systems.push({
      section: 'DHW',
      name: 'Calefacción y ACS',
      type: boiler[1],
      nominalPowerKw: parseSpanishNumber(boiler[2]),
      seasonalEfficiencyPct: parseSpanishNumber(boiler[3]),
      energyType: 'Gas Natural',
      source: boiler[4],
    });
  }
  return systems.length > 0 ? systems : undefined;
}

function parseImprovementMeasures(text: string): CeeExtractedSections['improvementMeasures'] {
  return Array.from(text.matchAll(/DESCRIPCI[ÓO]N\s+DE\s+LA\s+MEDIDA\s+DE\s+MEJORA[\s\S]{0,260}?Caracter[ií]sticas[^)]*\)\s+(.+?)\s+Coste\s+estimado\s+de\s+la\s+medida\s+(\d{1,6}(?:[.,]\d+)?)\s*€/gi))
    .slice(0, 6)
    .map((match) => ({
      title: match[1].replace(/\s+/g, ' ').trim(),
      costEstimateEur: parseSpanishNumber(match[2]),
      summary: match[1].replace(/\s+/g, ' ').trim(),
    }));
}

function parseExtractedSections(text: string): CeeExtractedSections | undefined {
  const sections: CeeExtractedSections = {
    envelope: parseEnvelopeSections(text),
    systems: parseThermalSystems(text),
    indicators: parseEnergySections(text),
    improvementMeasures: parseImprovementMeasures(text),
    visitDate: parseDate(firstMatch(text, [/Fecha\s+de\s+realizaci[oó]n\s+de\s+la\s+visita\s+del\s+t[eé]cnico\s+certificador\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i])?.[1] || ''),
    technicianComments: firstMatch(text, [/COMENTARIOS\s+DEL\s+T[EÉ]CNICO\s+CERTIFICADOR\s+(.+?)\s+DOCUMENTACION\s+ADJUNTA/i])?.[1]?.trim(),
  };

  return sections.envelope || sections.systems?.length || sections.indicators || sections.improvementMeasures?.length
    ? sections
    : undefined;
}

export function parseCeeText(text: string): CeeData {
  const data: CeeData = {};
  const rawMatches: Record<string, string> = {};

  // Clean text for better matching - replace multiple whitespace and newlines with a single space
  const cleanText = text.replace(/\s+/g, ' ');

  // 1. Energy Letter (Consumption)
  const energyLetterMatch = cleanText.match(/Consumo de energía primaria no renovable\s+\[kWh\/m²\s*año\]\s+(\d+[,.]?\d*)\s+([A-G])/i) ||
                             cleanText.match(/Calificación energética del edificio en consumo\s+([A-G])/i) ||
                             cleanText.match(/([A-G])\s+Consumo de energía/i);
  if (energyLetterMatch) {
    data.energyLetter = (energyLetterMatch[2] || energyLetterMatch[1]).toUpperCase() as CeeData['energyLetter'];
    rawMatches.energyLetter = energyLetterMatch[0];
  }

  // 2. Emissions Letter
  const emissionsLetterMatch = cleanText.match(/Emisiones de dióxido de carbono\s+\[kgCO₂\/m²\s*año\]\s+(\d+[,.]?\d*)\s+([A-G])/i) ||
                               cleanText.match(/Calificación energética del edificio en emisiones\s+([A-G])/i) ||
                               cleanText.match(/([A-G])\s+Emisiones/i);
  if (emissionsLetterMatch) {
    data.emissionsLetter = (emissionsLetterMatch[2] || emissionsLetterMatch[1]).toUpperCase() as CeeData['emissionsLetter'];
    rawMatches.emissionsLetter = emissionsLetterMatch[0];
  }

  // 3. Primary Energy Consumption (Numeric)
  const primaryEnergyMatch = cleanText.match(/Consumo de energía primaria no renovable\s+\[?kWh\/m²\s*año\]?\s+(\d+[,.]?\d*)/i);
  if (primaryEnergyMatch) {
    data.primaryEnergyKwhM2Year = parseFloat(primaryEnergyMatch[1].replace(',', '.'));
    rawMatches.primaryEnergy = primaryEnergyMatch[0];
  }

  // 4. Emissions (Numeric)
  const emissionsMatch = cleanText.match(/Emisiones de dióxido de carbono\s+\[?kgCO₂\/m²\s*año\]?\s+(\d+[,.]?\d*)/i);
  if (emissionsMatch) {
    data.emissionsKgCo2M2Year = parseFloat(emissionsMatch[1].replace(',', '.'));
    rawMatches.emissions = emissionsMatch[0];
  }

  // 5. Cadastral Reference
  // Standard full length: 20 chars
  const cadastralMatch = cleanText.match(/Referencia\s+catastral\s*:\s*([A-Z0-9]+)/i) ||
                         cleanText.match(/Ref\.\s*Catastral\s*:\s*([A-Z0-9]+)/i) ||
                         cleanText.match(/Referencia\s+catastral\s+([A-Z0-9]{14,20})/i);
  if (cadastralMatch) {
    data.cadastralReference = cadastralMatch[1].toUpperCase();
    rawMatches.cadastralReference = cadastralMatch[0];
  }

  // 6. Address / Municipality
  const addressMatch = cleanText.match(/Dirección\s*:?\s*([^,.\n]+)/i);
  if (addressMatch) {
    data.address = addressMatch[1].trim();
  }

  const municipalityMatch = cleanText.match(/Municipio\s*:?\s*([^,.\n]+)/i);
  if (municipalityMatch) {
    data.municipality = municipalityMatch[1].trim();
  }

  // 7. Area
  const areaMatch = cleanText.match(/Superficie\s*útil\s*habitable\s*\(m²\)\s*:?\s*(\d+[,.]?\d*)/i);
  if (areaMatch) {
    data.areaM2 = parseFloat(areaMatch[1].replace(',', '.'));
  }

  // 8. Issue Date
  const dateMatch = cleanText.match(/Fecha\s+de\s+emisión\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) {
    data.issueDate = dateMatch[1];
  }

  data.rawMatches = rawMatches;
  return data;
}

export function parseCeeToCertificate(text: string, options: { sourceFormat?: EnergyCertificateCEE['sourceFormat'] } = {}): EnergyCertificateCEE {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const rawTextHash = crypto.createHash('sha256').update(cleanText).digest('hex');
  const sourceProgram = detectCertificateProgram(cleanText);
  const globalRatings = parseFirstGlobalRatings(cleanText);
  const globalLetter = globalRatings.primaryLetter || parseEnergyLetter(cleanText);

  const primaryEnergyMatch = firstMatch(cleanText, [
    /energ[ií]a\s+primaria\s+no\s+renovable[\s\S]{0,80}?(\d{1,4}(?:[.,]\d+)?)/i,
    /consumo\s+global\s+de\s+energ[ií]a[\s\S]{0,80}?(\d{1,4}(?:[.,]\d+)?)/i,
  ]);
  const emissionsMatch = firstMatch(cleanText, [
    /emisiones\s+de\s+di[oó]xido\s+de\s+carbono\s*(?:\[[^\]]*\]\s*)?(\d{1,4}(?:[.,]\d+)?)/i,
    /kg\s*co2[^\]]*\]\s*(\d{1,4}(?:[.,]\d+)?)/i,
  ]);
  const usefulAreaMatch = firstMatch(cleanText, [
    /superficie\s+habitable\s*\[[^\]]*m[²2][^\]]*\]\s*(\d{1,5}(?:[.,]\d+)?)/i,
    /superficie\s+habitable(?:\s*\(m[²2]\))?\s*:?\s*(\d{1,5}(?:[.,]\d+)?)/i,
    /superficie\s+[uú]til\s+habitable\s*\[[^\]]*m[²2][^\]]*\]\s*(\d{1,5}(?:[.,]\d+)?)/i,
    /superficie\s+[uú]til(?:\s+habitable)?(?:\s*\(m[²2]\))?\s*:?\s*(\d{1,5}(?:[.,]\d+)?)/i,
  ]);
  const builtAreaMatch = firstMatch(cleanText, [
    /superficie\s+construida(?:\s*\(m[²2]\))?\s*:?\s*(\d{1,5}(?:[.,]\d+)?)/i,
  ]);
  const yearMatch = firstMatch(cleanText, [
    /a[nñ]o\s+de\s+construcci[oó]n\s*:?\s*(\d{4})/i,
    /construido\s+en\s+(\d{4})/i,
  ]);
  const climateMatch = firstMatch(cleanText, [
    /zona\s+clim[aá]tica\s*:?\s*([A-E][1-4]?)/i,
  ]);
  const useTypeMatch = firstMatch(cleanText, [
    /uso\s+del\s+edificio\s*:?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ ]{3,50})/i,
    /tipo\s+de\s+edificio\s*:?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ ]{3,50})/i,
  ]);
  const rcMatch = firstMatch(cleanText, [
    /referencia\s+catastral\s*:?\s*([A-Z0-9]{14,20})/i,
  ]);
  const postalMatch = cleanText.match(/\b(\d{5})\b/);
  const issueDateMatch = firstMatch(cleanText, [
    /fecha\s+de\s+emisi[oó]n\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /fecha\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  ]);
  const validUntilMatch = firstMatch(cleanText, [
    /v[aá]lido\s+hasta\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /fecha\s+de\s+caducidad\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  ]);
  const addressMatch = firstMatch(cleanText, [
    /direcci[oó]n\s*:?\s*([^.;]{6,120})/i,
  ]);
  const heatingDemandMatch = firstMatch(cleanText, [
    /demanda\s+de\s+calefacci[oó]n[\s\S]{0,80}?(\d{1,4}(?:[.,]\d+)?)/i,
  ]);
  const coolingDemandMatch = firstMatch(cleanText, [
    /demanda\s+de\s+refrigeraci[oó]n[\s\S]{0,80}?(\d{1,4}(?:[.,]\d+)?)/i,
  ]);
  const acsDemandMatch = firstMatch(cleanText, [
    /demanda\s+de\s+acs[\s\S]{0,80}?(\d{1,4}(?:[.,]\d+)?)/i,
  ]);

  const recommendations = Array.from(cleanText.matchAll(/(?:recomendaci[oó]n|medida\s+de\s+mejora)\s*\d*[:.-]?\s*([^.;]{20,220})/gi))
    .slice(0, 8)
    .map((match) => ({ rawText: match[1].trim() }));

  const draft: EnergyCertificateCEE = {
    sourceProgram,
    sourceFormat: options.sourceFormat || 'PDF_TEXT',
    extractionStatus: 'PENDING',
    issueDate: issueDateMatch ? parseDate(issueDateMatch[1]) : undefined,
    validUntil: validUntilMatch ? parseDate(validUntilMatch[1]) : undefined,
    addressLine: addressMatch?.[1]?.trim(),
    cadastralReference: rcMatch?.[1]?.toUpperCase(),
    postalCode: postalMatch?.[1],
    useType: useTypeMatch?.[1]?.trim(),
    climateZone: climateMatch?.[1]?.toUpperCase(),
    yearBuilt: yearMatch ? Number.parseInt(yearMatch[1], 10) : undefined,
    usefulAreaM2: usefulAreaMatch ? parseAreaM2(usefulAreaMatch[1]) : undefined,
    builtAreaM2: builtAreaMatch ? parseAreaM2(builtAreaMatch[1]) : undefined,
    globalLetter,
    nonRenewableEPKwhM2Year: globalRatings.primaryEnergy ?? (primaryEnergyMatch ? parseEnergyIntensity(primaryEnergyMatch[1]) : undefined),
    emissionsKgCO2M2Year: globalRatings.emissions ?? (emissionsMatch ? parseEmissions(emissionsMatch[1]) : undefined),
    heatingDemandKwhM2Year: heatingDemandMatch ? parseEnergyIntensity(heatingDemandMatch[1]) : undefined,
    coolingDemandKwhM2Year: coolingDemandMatch ? parseEnergyIntensity(coolingDemandMatch[1]) : undefined,
    acsDemandKwhM2Year: acsDemandMatch ? parseEnergyIntensity(acsDemandMatch[1]) : undefined,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
    extractedSections: parseExtractedSections(cleanText),
    rawTextHash,
    rawXmlStored: false,
  };

  const confidence = confidenceForCertificate(draft, cleanText.length > 300);
  draft.extractionConfidence = confidence;
  draft.extractionStatus = draft.globalLetter && (draft.nonRenewableEPKwhM2Year || draft.emissionsKgCO2M2Year)
    ? 'PARSED'
    : 'NEEDS_REVIEW';
  draft.extractedFields = [
    ...extractedField('targetLetter', draft.globalLetter, confidence),
    ...extractedField('area', draft.usefulAreaM2 || draft.builtAreaM2, confidence, !draft.usefulAreaM2),
    ...extractedField('year', draft.yearBuilt, confidence),
    ...extractedField('zipcode', draft.postalCode, confidence),
    ...extractedField('climateZone', draft.climateZone, confidence),
  ];

  return draft;
}

export async function tryExtractEmbeddedCeeXml(): Promise<string | null> {
  return null;
}

export function parseCeeXml(xml: string): EnergyCertificateCEE {
  return parseCeeToCertificate(xml, { sourceFormat: 'XML' });
}
