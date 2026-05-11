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
