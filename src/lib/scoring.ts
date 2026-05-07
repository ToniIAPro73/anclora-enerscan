export interface PropertyData {
  year: number;
  propertyType: string;
  heating: string;
  windows: string;
  renewables: string;
}

export interface ScoringResult {
  estimatedLetter: string;
  confidence: string;
  penalties: string[];
}

export function calculateScore(data: PropertyData): ScoringResult {
  let score = 50; // Base score (0 = A, 100 = G roughly)
  let confidence = "Alta";
  const penalties: string[] = [];

  // Age based
  if (data.year < 1980) {
    score += 30; // Older homes are generally worse
    penalties.push("Antigüedad (construcción previa a normativas térmicas de 1980)");
  } else if (data.year < 2006) {
    score += 15;
    penalties.push("Aislamiento estándar de la época (NBE-CT-79)");
  } else {
    score -= 10;
  }

  // Windows
  if (data.windows === "simple") {
    score += 15;
    penalties.push("Ventanas de acristalamiento simple (alta pérdida térmica)");
  } else if (data.windows === "doble") {
    score -= 5;
  }

  // Heating
  if (data.heating === "electric") {
    score += 20;
    penalties.push("Calefacción eléctrica directa (alta penalización en energía primaria)");
  } else if (data.heating === "gas") {
    score += 5;
    penalties.push("Caldera de gas/combustible fósil");
  } else if (data.heating === "aerothermia") {
    score -= 20;
  }

  // Renewables
  if (data.renewables === "none") {
    score += 5;
  } else {
    score -= 15;
  }

  let letter = "G";
  if (score < 10) letter = "A";
  else if (score < 25) letter = "B";
  else if (score < 40) letter = "C";
  else if (score < 55) letter = "D";
  else if (score < 70) letter = "E";
  else if (score < 85) letter = "F";
  
  if (!data.year || !data.propertyType) {
      confidence = "Baja";
  } else if (!data.windows || !data.heating) {
      confidence = "Media";
  }

  return {
    estimatedLetter: letter,
    confidence,
    penalties
  };
}