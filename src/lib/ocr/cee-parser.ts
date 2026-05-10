import { CeeData } from './types';

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
