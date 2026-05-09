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
  it('includes nine final images and one CEE PDF', () => {
    const images = demoAttachments.filter((attachment) => attachment.type.startsWith('image/'));
    const pdfs = demoAttachments.filter((attachment) => attachment.type === 'application/pdf');
    expect(images).toHaveLength(9);
    expect(pdfs.length).toBeGreaterThanOrEqual(1);
  });

  it('includes the selected image captions for the demo PDF annex', () => {
    expect(demoAttachments.filter((attachment) => attachment.category === 'EXTERIOR')).toHaveLength(3);
    expect(demoAttachments.filter((attachment) => attachment.category === 'INTERIOR')).toHaveLength(6);
    expect(demoAttachments.map((attachment) => attachment.caption)).toEqual(expect.arrayContaining([
      'Fachada principal',
      'Vista exterior lateral',
      'Distribuidor de planta superior',
      'Baño principal / baño en suite',
      'Dormitorio principal',
      'Acceso y escalera interior',
      'Cocina',
      'Salón principal',
      'Vista exterior posterior con piscina',
    ]));
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
    expect(payload.publicRef).toBe('DEMO-EZNFOIFQ');
    expect(payload.attachments.map((attachment) => attachment.id)).toContain('demo-cee');
    expect(payload.attachments).toHaveLength(10);
    expect(payload.propertyData.area).toBe(185);
  });
});
