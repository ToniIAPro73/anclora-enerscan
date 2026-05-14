import { resolveWizardFieldValue } from '@/lib/ingestion/field-priority';

describe('field priority', () => {
  it('does not overwrite user data without confirmation', () => {
    const resolved = resolveWizardFieldValue({
      fieldName: 'area',
      currentValue: 80,
      currentSource: 'USER',
      candidates: [{ fieldName: 'area', value: 52, sourceType: 'CEE', confidence: 0.9 }],
    });
    expect(resolved.value).toBe(80);
    expect(resolved.source).toBe('USER');
  });

  it('prefers CEE over Catastro for energy fields', () => {
    const resolved = resolveWizardFieldValue({
      fieldName: 'targetLetter',
      candidates: [
        { fieldName: 'targetLetter', value: 'E', sourceType: 'CEE', confidence: 0.8 },
        { fieldName: 'targetLetter', value: 'D', sourceType: 'ENGINE', confidence: 0.9 },
      ],
    });
    expect(resolved.value).toBe('E');
    expect(resolved.source).toBe('CEE');
  });
});
