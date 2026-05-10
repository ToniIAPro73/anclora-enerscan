import { parseCeeText } from '@/lib/ocr/cee-parser';
import { parseBudgetText } from '@/lib/ocr/budget-parser';

describe('OCR Parsers', () => {
  describe('parseCeeText', () => {
    it('should extract letters and numeric values from CEE text', () => {
      const text = '... Consumo de energía primaria no renovable [kWh/m² año] 145.5 E ... Emisiones de dióxido de carbono [kgCO₂/m² año] 32.1 D ...';
      const result = parseCeeText(text);
      expect(result.energyLetter).toBe('E');
      expect(result.emissionsLetter).toBe('D');
      expect(result.primaryEnergyKwhM2Year).toBe(145.5);
      expect(result.emissionsKgCo2M2Year).toBe(32.1);
    });

    it('should extract cadastral reference', () => {
      const text = 'Referencia catastral: 1234567AB12345C0001XY';
      const result = parseCeeText(text);
      expect(result.cadastralReference).toBe('1234567AB12345C0001XY');
    });
  });

  describe('parseBudgetText', () => {
    it('should extract total amount and detected measures', () => {
      const text = 'Presupuesto para instalación de Aerotermia y Ventanas PVC. IMPORTE TOTAL 12.500,50 €';
      const result = parseBudgetText(text);
      expect(result.totalAmount).toBe(12500.50);
      expect(result.detectedMeasures).toContain('aerotermia');
      expect(result.detectedMeasures).toContain('ventanas');
    });
  });
});
