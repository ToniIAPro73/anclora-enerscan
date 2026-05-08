import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScoreV2 } from '@/lib/scoring';
import { z } from 'zod';
import { PropertyDataV2 } from '@/lib/domain/energy-assessment';
import {
  normalizePropertyType,
  normalizeHeatingSystem,
  normalizeCoolingSystem,
  normalizeWaterHeatingSystem,
  normalizeWindowType,
  normalizeRenewableSystem,
  normalizeInsulationLevel,
  normalizeBudgetRange,
  normalizeAssessmentObjective,
  normalizeEnergyLetter
} from '@/lib/domain/normalizers';

const assessmentSchema = z.object({
  year: z.number().or(z.string().transform(Number)),
  area: z.number().or(z.string().transform(Number)),
  zipcode: z.string(),
  propertyType: z.any().transform(normalizePropertyType),
  heating: z.any().transform(normalizeHeatingSystem),
  cooling: z.any().transform(normalizeCoolingSystem),
  waterHeating: z.any().transform(normalizeWaterHeatingSystem),
  windows: z.any().transform(normalizeWindowType),
  renewables: z.any().transform(normalizeRenewableSystem),
  facadeInsulation: z.any().transform(normalizeInsulationLevel).optional(),
  roofInsulation: z.any().transform(normalizeInsulationLevel).optional(),
  budgetRange: z.any().transform(normalizeBudgetRange).optional(),
  targetLetter: z.any().transform(normalizeEnergyLetter).optional(),
  objective: z.any().transform(normalizeAssessmentObjective).optional(),
});

export async function POST(req: Request) {
  try {
    const rawData = await req.json();

    const parseResult = assessmentSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: parseResult.error.format() }, { status: 400 });
    }

    const data: PropertyDataV2 = parseResult.data;

    const result = calculateScoreV2(data);

    const assessment = await prisma.assessment.create({
      data: {
        objective: data.objective,
        propertyType: data.propertyType,
        year: data.year,
        area: data.area,
        zipcode: data.zipcode,
        heating: data.heating,
        cooling: data.cooling,
        waterHeating: data.waterHeating,
        windows: data.windows,
        renewables: data.renewables,
        facadeInsulation: data.facadeInsulation,
        roofInsulation: data.roofInsulation,
        budgetRange: data.budgetRange,
        targetLetter: data.targetLetter,

        score: result.score,
        estimatedLetter: result.estimatedLetter,
        confidence: result.confidence,
        climateZone: result.climateZone,
        penalties: JSON.stringify(result.penalties),
        strengths: JSON.stringify(result.strengths),
        missingData: JSON.stringify(result.missingData),
        explanation: result.explanation
      }
    });

    return NextResponse.json({
      id: assessment.id,
      estimatedLetter: result.estimatedLetter,
      confidence: result.confidence,
      score: result.score,
      climateZone: result.climateZone,
      penalties: result.penalties,
      strengths: result.strengths,
      missingData: result.missingData
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}
