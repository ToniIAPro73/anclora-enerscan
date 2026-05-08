import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScoreV2 } from '@/lib/scoring';
import { demoPropertyData } from '@/lib/demo-assessment';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const result = calculateScoreV2(demoPropertyData);

  const assessment = await prisma.assessment.create({
    data: {
      objective: demoPropertyData.objective,
      propertyType: demoPropertyData.propertyType,
      orientation: demoPropertyData.orientation,
      roofType: demoPropertyData.roofType,
      year: demoPropertyData.year,
      area: demoPropertyData.area,
      zipcode: demoPropertyData.zipcode,
      heating: demoPropertyData.heating,
      cooling: demoPropertyData.cooling,
      waterHeating: demoPropertyData.waterHeating,
      ventilation: demoPropertyData.ventilation,
      windows: demoPropertyData.windows,
      renewables: demoPropertyData.renewables,
      facadeInsulation: demoPropertyData.facadeInsulation,
      roofInsulation: demoPropertyData.roofInsulation,
      budgetRange: demoPropertyData.budgetRange,
      timelineHorizon: demoPropertyData.timelineHorizon,
      targetLetter: demoPropertyData.targetLetter,
      isDemo: true,
      score: result.score,
      estimatedLetter: result.estimatedLetter,
      confidence: result.confidence,
      climateZone: result.climateZone,
      penalties: JSON.stringify(result.penalties),
      strengths: JSON.stringify(result.strengths),
      missingData: JSON.stringify(result.missingData),
      explanation: result.explanation,
      attachments: {
        create: [
          {
            name: 'demo-documentacion.md',
            type: 'text/markdown',
            size: 1240,
            path: 'demo://documentacion',
          },
        ],
      },
    },
  });

  return NextResponse.redirect(new URL(`/assessment/${assessment.id}`, req.url));
}
