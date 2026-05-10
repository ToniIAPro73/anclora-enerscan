import type { BudgetRange, EnergyLetter } from '../domain/energy-assessment';
import type { CostInterventionLevel, CostPropertyType } from './types';

export type CostScenarioTemplate = {
  id: string;
  propertyTypes: CostPropertyType[];
  letterGainMin: number;
  letterGainMax: number;
  interventionLevel: CostInterventionLevel;
  budgetLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PREMIUM';
  measureCodes: string[];
  description: string;
  technicalNote: string;
};

export const costScenarioTemplates: CostScenarioTemplate[] = [
  { id: 'flat_letter_gain_1_light', propertyTypes: ['FLAT'], letterGainMin: 1, letterGainMax: 1, interventionLevel: 'LIGHT', budgetLevel: 'LOW', measureCodes: ['replace_windows', 'install_heat_pump_air_air'], description: 'Actuación ligera en piso.', technicalNote: 'No imputa cubierta completa sin medición.' },
  { id: 'flat_letter_gain_2_medium', propertyTypes: ['FLAT'], letterGainMin: 2, letterGainMax: 2, interventionLevel: 'MEDIUM', budgetLevel: 'MEDIUM', measureCodes: ['replace_windows', 'facade_insulation', 'install_heat_pump_air_air'], description: 'Paquete medio para piso.', technicalNote: 'Fachada estimada como superficie privativa proxy.' },
  { id: 'flat_letter_gain_3_deep', propertyTypes: ['FLAT'], letterGainMin: 3, letterGainMax: 4, interventionLevel: 'DEEP', budgetLevel: 'HIGH', measureCodes: ['deep_energy_retrofit', 'replace_windows', 'install_heat_recovery_ventilation'], description: 'Reforma energética profunda en piso.', technicalNote: 'Requiere proyecto, permisos y coordinación comunitaria.' },
  { id: 'single_family_letter_gain_1_light', propertyTypes: ['SINGLE_FAMILY'], letterGainMin: 1, letterGainMax: 1, interventionLevel: 'LIGHT', budgetLevel: 'LOW', measureCodes: ['replace_windows', 'roof_insulation'], description: 'Mejora ligera de vivienda unifamiliar.', technicalNote: 'Prioriza huecos y cubierta.' },
  { id: 'single_family_letter_gain_2_medium', propertyTypes: ['SINGLE_FAMILY'], letterGainMin: 2, letterGainMax: 2, interventionLevel: 'MEDIUM', budgetLevel: 'MEDIUM', measureCodes: ['replace_windows', 'roof_insulation', 'facade_insulation', 'install_heat_pump_air_water'], description: 'Paquete medio para unifamiliar.', technicalNote: 'Combina demanda y sistemas.' },
  { id: 'single_family_letter_gain_3_deep', propertyTypes: ['SINGLE_FAMILY'], letterGainMin: 3, letterGainMax: 4, interventionLevel: 'DEEP', budgetLevel: 'HIGH', measureCodes: ['deep_energy_retrofit', 'install_heat_pump_air_water', 'install_pv', 'install_heat_recovery_ventilation'], description: 'Rehabilitación profunda de unifamiliar.', technicalNote: 'Potencial alto, confianza dependiente de medición.' },
  { id: 'villa_letter_gain_2_premium', propertyTypes: ['VILLA'], letterGainMin: 2, letterGainMax: 2, interventionLevel: 'INTEGRAL', budgetLevel: 'PREMIUM', measureCodes: ['replace_windows', 'facade_insulation', 'install_heat_pump_air_water', 'install_pv'], description: 'Escenario premium para villa.', technicalNote: 'Puede requerir calidades altas y control de obra.' },
  { id: 'villa_letter_gain_4_deep', propertyTypes: ['VILLA'], letterGainMin: 4, letterGainMax: 4, interventionLevel: 'DEEP', budgetLevel: 'PREMIUM', measureCodes: ['deep_energy_retrofit', 'install_heat_pump_geothermal', 'install_pv', 'install_heat_recovery_ventilation'], description: 'Rehabilitación profunda premium de villa.', technicalNote: 'No garantiza salto oficial sin CEE.' },
  { id: 'local_light_hvac_lighting', propertyTypes: ['LOCAL'], letterGainMin: 1, letterGainMax: 1, interventionLevel: 'LIGHT', budgetLevel: 'LOW', measureCodes: ['local_hvac_lighting_upgrade', 'electrical_upgrade'], description: 'Actualización ligera de local.', technicalNote: 'Se centra en climatización e instalación eléctrica.' },
  { id: 'local_medium_hvac_envelope', propertyTypes: ['LOCAL'], letterGainMin: 2, letterGainMax: 2, interventionLevel: 'MEDIUM', budgetLevel: 'MEDIUM', measureCodes: ['local_hvac_lighting_upgrade', 'replace_windows', 'install_heat_pump_air_air'], description: 'Mejora media de local.', technicalNote: 'Requiere revisión de actividad y licencias.' },
  { id: 'local_full_reform', propertyTypes: ['LOCAL'], letterGainMin: 3, letterGainMax: 4, interventionLevel: 'INTEGRAL', budgetLevel: 'HIGH', measureCodes: ['local_hvac_lighting_upgrade', 'electrical_upgrade', 'plumbing_upgrade'], description: 'Acondicionamiento completo de local.', technicalNote: 'No incluye proyecto de actividad ni licencias.' },
  { id: 'community_facade_roof_letter_gain_1_2', propertyTypes: ['COMMUNITY'], letterGainMin: 1, letterGainMax: 2, interventionLevel: 'MEDIUM', budgetLevel: 'MEDIUM', measureCodes: ['community_facade_rehab', 'community_roof_rehab'], description: 'Fachada y cubierta comunitaria.', technicalNote: 'Exige acuerdo comunitario y mediciones reales.' },
  { id: 'community_deep_rehab_letter_gain_3_4', propertyTypes: ['COMMUNITY'], letterGainMin: 3, letterGainMax: 4, interventionLevel: 'DEEP', budgetLevel: 'HIGH', measureCodes: ['community_facade_rehab', 'community_roof_rehab', 'community_central_heating_upgrade'], description: 'Rehabilitación profunda de comunidad.', technicalNote: 'Debe gestionarse como proyecto comunitario.' },
];

const letterRank: Record<EnergyLetter, number> = { A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 };

export function estimateLetterGain(currentLetter?: string, targetLetter?: string) {
  if (!currentLetter || !targetLetter) return 1;
  const current = letterRank[currentLetter as EnergyLetter];
  const target = letterRank[targetLetter as EnergyLetter];
  if (!current || !target) return 1;
  return Math.max(1, Math.min(4, target - current));
}

export function selectCostScenarioTemplates(input: {
  propertyType: CostPropertyType;
  currentLetter?: string;
  targetLetter?: string;
  simulatorScenarioId?: string;
  budgetRange?: BudgetRange | string;
}): CostScenarioTemplate[] {
  const propertyType = input.propertyType === 'UNKNOWN' ? 'SINGLE_FAMILY' : input.propertyType;
  const gain = estimateLetterGain(input.currentLetter, input.targetLetter);
  const bySimulator = costScenarioTemplates.filter((template) => {
    if (!template.propertyTypes.includes(propertyType)) return false;
    if (input.simulatorScenarioId === 'basic') return template.interventionLevel === 'LIGHT';
    if (input.simulatorScenarioId === 'envelope') return template.measureCodes.some((code) => code.includes('insulation') || code === 'replace_windows');
    if (input.simulatorScenarioId === 'systems') return template.measureCodes.some((code) => code.includes('heat_pump') || code.includes('hvac'));
    if (input.simulatorScenarioId === 'renewables') return template.measureCodes.includes('install_pv');
    if (input.simulatorScenarioId === 'deep') return template.interventionLevel === 'DEEP' || template.interventionLevel === 'INTEGRAL';
    return gain >= template.letterGainMin && gain <= template.letterGainMax;
  });

  if (bySimulator.length > 0) return bySimulator.slice(0, 2);
  return costScenarioTemplates.filter((template) => template.propertyTypes.includes(propertyType)).slice(0, 2);
}

export function measuresForSimulatorScenario(input: {
  simulatorScenarioId: string;
  propertyType: CostPropertyType;
  currentLetter?: string;
  targetLetter?: string;
  budgetRange?: BudgetRange | string;
}) {
  const selected = selectCostScenarioTemplates(input)[0];
  if (selected) return selected;
  return costScenarioTemplates.find((template) => template.propertyTypes.includes(input.propertyType));
}
