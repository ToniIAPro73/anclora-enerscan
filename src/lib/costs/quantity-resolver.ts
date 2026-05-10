import type { PropertyDataV2 } from '../domain/energy-assessment';
import type { CostConfidence, CostPropertyType, ResolvedQuantity } from './types';

export function mapPropertyType(propertyType: PropertyDataV2['propertyType'] | string | undefined): CostPropertyType {
  if (propertyType === 'flat' || propertyType === 'penthouse' || propertyType === 'ground_floor') return 'FLAT';
  if (propertyType === 'house' || propertyType === 'terraced') return 'SINGLE_FAMILY';
  if (propertyType === 'local') return 'LOCAL';
  if (propertyType === 'community') return 'COMMUNITY';
  if (propertyType === 'villa') return 'VILLA';
  return 'UNKNOWN';
}

function result(formula: string, quantity: number, unit: string, confidence: CostConfidence, assumptions: string[]): ResolvedQuantity {
  return { formula, quantity: Math.max(0, Number(quantity.toFixed(2))), unit, confidence, assumptions };
}

export function resolveQuantity(input: {
  formula: string;
  propertyData: PropertyDataV2;
  propertyType?: CostPropertyType;
}): ResolvedQuantity | null {
  const { formula, propertyData } = input;
  const area = Number(propertyData.area);
  if (!Number.isFinite(area) || area <= 0) {
    return result(formula, 0, 'm2', 'LOW', ['No se puede estimar cantidad sin superficie útil válida.']);
  }

  const propertyType = input.propertyType || mapPropertyType(propertyData.propertyType);
  const exposed = propertyType === 'SINGLE_FAMILY' || propertyType === 'VILLA';

  switch (formula) {
    case 'floor_area_m2':
      return result(formula, area, 'm2', 'HIGH', ['Se usa la superficie declarada por el usuario.']);
    case 'local_area_m2':
      if (propertyType !== 'LOCAL') return null;
      return result(formula, area, 'm2', 'HIGH', ['Se usa la superficie declarada del local.']);
    case 'roof_area_m2':
      if (exposed || propertyType === 'COMMUNITY') {
        return result(formula, area, 'm2', propertyType === 'COMMUNITY' ? 'MEDIUM' : 'HIGH', ['La cubierta se aproxima a la superficie útil declarada.']);
      }
      return result(formula, area * 0.15, 'm2', 'LOW', ['En piso no se imputa cubierta completa; se usa un proxy bajo para encuentros o zonas privativas expuestas.']);
    case 'window_area_m2':
      return result(formula, area * 0.15, 'm2', 'MEDIUM', ['La superficie de huecos se estima como 15% de la superficie útil.']);
    case 'facade_area_m2':
      if (exposed) return result(formula, area * 0.8, 'm2', 'MEDIUM', ['La fachada se estima como 80% de la superficie útil en vivienda expuesta.']);
      if (propertyType === 'COMMUNITY') return result('community_facade_area_m2', area * 1.2, 'm2', 'LOW', ['Fachada comunitaria aproximada como 120% de superficie agregada declarada.']);
      return result(formula, area * 0.25, 'm2', 'LOW', ['En piso se estima fachada privativa como 25% de la superficie por falta de medición de envolvente.']);
    case 'community_facade_area_m2':
      return result(formula, area * 1.2, 'm2', propertyType === 'COMMUNITY' ? 'MEDIUM' : 'LOW', ['Proxy de fachada comunitaria: 120% de la superficie declarada.']);
    case 'terrace_area_m2':
      return null;
    case 'fixed_1':
    case 'heat_pump_unit':
    case 'bathroom_unit':
      return result(formula, 1, 'ud', 'MEDIUM', ['Se estima una unidad por ausencia de medición detallada.']);
    case 'kwp_estimated': {
      const kwp = Math.min(Math.max(area / 25, 2), 8);
      return result(formula, kwp, 'kWp', exposed || propertyData.roofType === 'pitched' ? 'MEDIUM' : 'LOW', ['Potencia FV proxy: superficie / 25, limitada entre 2 y 8 kWp.']);
    }
    default:
      return null;
  }
}
