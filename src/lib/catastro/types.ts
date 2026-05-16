import { z } from 'zod';

export const CadastralMatchSchema = z.object({
  id: z.string().optional(),
  cadastralReference: z.string(),       // Full 20-char reference
  parcelReference: z.string().optional(), // 14-char parcel reference
  province: z.string(),
  municipality: z.string(),
  address: z.string(),
  postalCode: z.string().optional(),
  
  // Internal address
  block: z.string().optional(),
  staircase: z.string().optional(),
  floor: z.string().optional(),
  door: z.string().optional(),

  propertyUse: z.string().optional(),
  surfaceBuiltM2: z.number().optional(),
  surfaceDwellingM2: z.number().optional(),
  surfaceCommonM2: z.number().optional(),
  surfacePlotM2: z.number().optional(),
  participationCoefficient: z.number().optional(),
  yearBuilt: z.number().optional(),
  
  lat: z.number().optional(),
  lng: z.number().optional(),
  source: z.string().default('catastro'),
  confidence: z.number().default(1),
  raw: z.any().optional(),
});

export type CadastralMatch = z.infer<typeof CadastralMatchSchema>;

export type CadastralMapFeature = {
  id: string;
  cadastralReference?: string;
  parcelReference?: string;
  label?: string;
  kind: 'parcel' | 'building' | 'unit' | 'address';
  geometry?: unknown;
  center?: { lat: number; lng: number };
  bounds?: [[number, number], [number, number]];
  selected?: boolean;
  source: 'catastro' | 'wms' | 'fallback';
};

export const CatastroResolveResponseSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    matches: z.array(CadastralMatchSchema),
    source: z.object({
      system: z.literal('catastro'),
      mode: z.enum(['rc', 'address', 'coords', 'map']),
      retrievedAt: z.string(),
      confidence: z.number(),
    }),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

export type CatastroResolveResponse = z.infer<typeof CatastroResolveResponseSchema>;

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().optional()
);

export const CadastralReferenceInputSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, '').toUpperCase() : value),
  z.string().regex(/^[A-Z0-9]{14}([A-Z0-9]{6})?$/, 'INVALID_REFERENCE')
);

export const CatastroAddressInputSchema = z.object({
  province: z.string().trim().min(1),
  municipality: z.string().trim().min(1),
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  sigla: optionalTrimmedString,
  provinceCode: optionalTrimmedString,
  municipalityCode: optionalTrimmedString,
  streetCode: optionalTrimmedString,
  block: optionalTrimmedString,
  staircase: optionalTrimmedString,
  floor: optionalTrimmedString,
  door: optionalTrimmedString,
});

export const CatastroCoordinatesInputSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const CatastroResolveRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('rc'),
    rc: CadastralReferenceInputSchema,
  }),
  CatastroAddressInputSchema.extend({
    mode: z.literal('address'),
  }),
  CatastroCoordinatesInputSchema.extend({
    mode: z.literal('coords'),
  }),
]);

export type CatastroResolveRequest = z.infer<typeof CatastroResolveRequestSchema>;

export const ProvinceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Province = z.infer<typeof ProvinceSchema>;

export const MunicipalitySchema = z.object({
  id: z.string(),
  name: z.string(),
  provinceId: z.string(),
});

export type Municipality = z.infer<typeof MunicipalitySchema>;
