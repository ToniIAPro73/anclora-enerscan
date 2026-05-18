import type { ConditionRiskItem, ConditionRiskCategory } from './types';

export type ConditionRiskInput = {
  year: number;
  propertyType?: string | null;
  roofType?: string | null;
  windows?: string | null;
  facadeInsulation?: string | null;
  roofInsulation?: string | null;
  ventilation?: string | null;
  heating?: string | null;
  waterHeating?: string | null;
  cooling?: string | null;
  renewables?: string | null;
  hasCeeDocument: boolean;
  hasBudgetDocument: boolean;
  hasCatastro: boolean;
  isMultiFamily: boolean; // flat, penthouse, ground_floor
  photoCount: number;
  // optional declared signals
  declaredDampness?: boolean;
  declaredCondensation?: boolean;
  hasElevator?: boolean | null;
  floor?: number | null;
  accessBarriers?: boolean | null;
  affectsCommonElements?: boolean | null;
};

function isOldBuilding(year: number) {
  return year < 1980;
}

function isVeryOldBuilding(year: number) {
  return year < 1960;
}

function categoryFor(value: number): ConditionRiskCategory {
  if (value >= 3) return 3;
  if (value >= 2) return 2;
  return 1;
}

export function buildConditionRiskItems(input: ConditionRiskInput): ConditionRiskItem[] {
  const items: ConditionRiskItem[] = [];
  const { year } = input;

  // --- Roof ---
  {
    const isUniFamily = !input.isMultiFamily;
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'roof.ok';
    let source: ConditionRiskItem['source'] = 'inferred';
    if (isUniFamily && isOldBuilding(year) && !input.roofInsulation) {
      cat = 2;
      reasonKey = 'roof.old_no_insulation';
    }
    if (isVeryOldBuilding(year) && isUniFamily) {
      cat = 2;
      reasonKey = 'roof.very_old';
    }
    if (!input.roofType && isOldBuilding(year) && isUniFamily) {
      cat = 2;
      reasonKey = 'roof.no_data';
      source = 'unknown';
    }
    items.push({
      element: 'roof',
      category: cat,
      source,
      confidence: source === 'unknown' ? 'unknown' : 'low',
      reasonKey,
      recommendationKey: cat >= 2 ? 'roof.review' : 'roof.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  // --- Facade ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'facade.ok';
    if (isOldBuilding(year) && (!input.facadeInsulation || input.facadeInsulation === 'none')) {
      cat = 2;
      reasonKey = 'facade.old_no_insulation';
    }
    items.push({
      element: 'facade',
      category: cat,
      source: input.facadeInsulation ? 'declared' : 'inferred',
      confidence: input.facadeInsulation ? 'medium' : 'low',
      reasonKey,
      recommendationKey: cat >= 2 ? 'facade.review' : 'facade.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  // --- Windows ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'windows.ok';
    let confidence: ConditionRiskItem['confidence'] = 'medium';
    const isOld = !input.windows || input.windows === 'single';
    if (isOld && isOldBuilding(year)) {
      cat = 2;
      reasonKey = 'windows.old_or_single';
      confidence = input.windows ? 'medium' : 'low';
    }
    items.push({
      element: 'windows',
      category: cat,
      source: input.windows ? 'declared' : 'inferred',
      confidence,
      reasonKey,
      recommendationKey: cat >= 2 ? 'windows.review' : 'windows.no_action',
      requiresProfessionalReview: false,
    });
  }

  // --- Dampness ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'dampness.not_declared';
    let source: ConditionRiskItem['source'] = 'unknown';
    if (input.declaredDampness) {
      cat = 3;
      reasonKey = 'dampness.declared';
      source = 'declared';
    } else if (input.declaredCondensation) {
      cat = 2;
      reasonKey = 'dampness.condensation_declared';
      source = 'declared';
    }
    items.push({
      element: 'dampness',
      category: cat,
      source,
      confidence: source === 'unknown' ? 'unknown' : 'medium',
      reasonKey,
      recommendationKey: cat === 3 ? 'dampness.urgent' : cat === 2 ? 'dampness.review' : 'dampness.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  // --- Ventilation ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'ventilation.ok';
    const isDeficient = !input.ventilation || input.ventilation === 'natural';
    const insulated = input.facadeInsulation && input.facadeInsulation !== 'none';
    if (isDeficient && insulated && isOldBuilding(year)) {
      cat = 2;
      reasonKey = 'ventilation.risk_condensation';
    } else if (!input.ventilation) {
      cat = categoryFor(1);
      reasonKey = 'ventilation.unknown';
    }
    items.push({
      element: 'ventilation',
      category: cat,
      source: input.ventilation ? 'declared' : 'unknown',
      confidence: input.ventilation ? 'medium' : 'unknown',
      reasonKey,
      recommendationKey: cat >= 2 ? 'ventilation.review' : 'ventilation.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  // --- Heating ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'heating.ok';
    if (!input.heating) {
      cat = 2;
      reasonKey = 'heating.unknown';
    } else if (isOldBuilding(year) && !input.hasCeeDocument) {
      cat = 2;
      reasonKey = 'heating.old_no_doc';
    }
    items.push({
      element: 'heating',
      category: cat,
      source: input.heating ? 'declared' : 'unknown',
      confidence: input.hasCeeDocument ? 'high' : input.heating ? 'medium' : 'unknown',
      reasonKey,
      recommendationKey: cat >= 2 ? 'heating.review' : 'heating.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  // --- DHW ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'dhw.ok';
    if (!input.waterHeating) {
      cat = 2;
      reasonKey = 'dhw.unknown';
    }
    items.push({
      element: 'dhw',
      category: cat,
      source: input.waterHeating ? 'declared' : 'unknown',
      confidence: input.hasCeeDocument ? 'high' : input.waterHeating ? 'medium' : 'unknown',
      reasonKey,
      recommendationKey: cat >= 2 ? 'dhw.review' : 'dhw.no_action',
      requiresProfessionalReview: false,
    });
  }

  // --- Cooling ---
  {
    items.push({
      element: 'cooling',
      category: 1,
      source: input.cooling ? 'declared' : 'unknown',
      confidence: input.cooling ? 'medium' : 'unknown',
      reasonKey: input.cooling ? 'cooling.ok' : 'cooling.unknown',
      recommendationKey: 'cooling.no_action',
      requiresProfessionalReview: false,
    });
  }

  // --- Electricity basic ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'electricity.ok';
    if (isVeryOldBuilding(year)) {
      cat = 2;
      reasonKey = 'electricity.very_old';
    }
    items.push({
      element: 'electricity_basic',
      category: cat,
      source: 'inferred',
      confidence: 'low',
      reasonKey,
      recommendationKey: cat >= 2 ? 'electricity.review' : 'electricity.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  // --- Accessibility ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'accessibility.ok';
    const isHighFloor = typeof input.floor === 'number' && input.floor > 2;
    const noElevator = input.hasElevator === false;
    if (input.accessBarriers) {
      cat = 2;
      reasonKey = 'accessibility.barriers_declared';
    } else if (isHighFloor && noElevator) {
      cat = 2;
      reasonKey = 'accessibility.high_floor_no_elevator';
    } else if (input.hasElevator == null && input.isMultiFamily) {
      reasonKey = 'accessibility.unknown';
    }
    items.push({
      element: 'accessibility',
      category: cat,
      source: input.hasElevator != null ? 'declared' : 'unknown',
      confidence: input.hasElevator != null ? 'medium' : 'unknown',
      reasonKey,
      recommendationKey: cat >= 2 ? 'accessibility.review' : 'accessibility.no_action',
      requiresProfessionalReview: false,
    });
  }

  // --- Common elements ---
  {
    let cat: ConditionRiskCategory = 1;
    let reasonKey = 'common_elements.not_affected';
    if (input.affectsCommonElements) {
      cat = 2;
      reasonKey = 'common_elements.affected';
    } else if (input.isMultiFamily && (input.facadeInsulation === 'none' || !input.facadeInsulation)) {
      cat = 2;
      reasonKey = 'common_elements.facade_multiunit';
    }
    items.push({
      element: 'common_elements',
      category: cat,
      source: input.affectsCommonElements != null ? 'declared' : 'inferred',
      confidence: input.affectsCommonElements != null ? 'medium' : 'low',
      reasonKey,
      recommendationKey: cat >= 2 ? 'common_elements.validate_community' : 'common_elements.no_action',
      requiresProfessionalReview: cat >= 2,
    });
  }

  return items;
}
