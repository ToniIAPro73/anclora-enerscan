import type { DataSourceType, ExtractedField } from './types';

const SOURCE_PRIORITY: Record<DataSourceType, number> = {
  USER: 100,
  MANUAL_OVERRIDE: 95,
  CEE: 85,
  CATASTRO: 80,
  OCR: 60,
  ENGINE: 40,
  BUDGET: 30,
};

export function resolveWizardFieldValue(input: {
  fieldName: string;
  currentValue?: unknown;
  currentSource?: DataSourceType;
  candidates: ExtractedField[];
  userConfirmedOverwrite?: boolean;
}) {
  if (
    input.currentValue !== undefined &&
    input.currentValue !== null &&
    input.currentValue !== '' &&
    (input.currentSource === 'USER' || input.currentSource === 'MANUAL_OVERRIDE') &&
    !input.userConfirmedOverwrite
  ) {
    return {
      value: input.currentValue,
      source: input.currentSource,
      confidence: 1,
      requiresReview: false,
      reason: 'El usuario ya modifico este campo; no se sobrescribe sin confirmacion.',
    };
  }

  const candidate = input.candidates
    .filter((item) => item.fieldName === input.fieldName && item.value !== undefined && item.value !== null && item.value !== '')
    .sort((a, b) => {
      const priorityDelta = SOURCE_PRIORITY[b.sourceType] - SOURCE_PRIORITY[a.sourceType];
      if (priorityDelta !== 0) return priorityDelta;
      return (b.confidence || 0) - (a.confidence || 0);
    })[0];

  if (!candidate) {
    return {
      value: input.currentValue,
      source: input.currentSource,
      requiresReview: true,
      reason: 'No hay candidato fiable para este campo.',
    };
  }

  return {
    value: candidate.value,
    source: candidate.sourceType,
    confidence: candidate.confidence,
    requiresReview: Boolean(candidate.requiresReview),
    reason: `Valor seleccionado desde ${candidate.sourceType}.`,
  };
}
