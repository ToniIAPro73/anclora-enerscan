import fs from 'fs';
import { calculateScoreV2 } from '../src/lib/scoring';
import {
  demoAttachments,
  demoCertificate,
  demoProperty,
  getDemoAssessmentPayload,
  getDemoAssetPath,
} from '../src/lib/demo-assets';

describe('demo assets', () => {
  it('includes at least six images and one CEE PDF', () => {
    const images = demoAttachments.filter((attachment) => attachment.type.startsWith('image/'));
    const pdfs = demoAttachments.filter((attachment) => attachment.type === 'application/pdf');
    expect(images).toHaveLength(6);
    expect(pdfs.length).toBeGreaterThanOrEqual(1);
  });

  it('includes two exterior and four interior images', () => {
    expect(demoAttachments.filter((attachment) => attachment.category === 'EXTERIOR')).toHaveLength(2);
    expect(demoAttachments.filter((attachment) => attachment.category === 'INTERIOR')).toHaveLength(4);
  });

  it('resolves every demo asset to an existing local file', () => {
    for (const attachment of demoAttachments) {
      const assetPath = getDemoAssetPath(attachment.id);
      expect(assetPath).toBeTruthy();
      expect(fs.existsSync(assetPath!)).toBe(true);
      expect(fs.statSync(assetPath!).size).toBeGreaterThan(0);
    }
  });

  it('keeps demo scoring aligned with the CEE demo letter', () => {
    const score = calculateScoreV2(demoProperty);
    expect(score.estimatedLetter).toBe(demoCertificate.letter);
    expect(demoCertificate.letter).toBe('E');
  });

  it('builds a stateless demo payload with consistent attachments', () => {
    const payload = getDemoAssessmentPayload();
    expect(payload.isDemo).toBe(true);
    expect(payload.attachments.map((attachment) => attachment.id)).toContain('demo-cee');
    expect(payload.propertyData.area).toBe(185);
  });
});
