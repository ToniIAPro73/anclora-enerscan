import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateScenarios } from '@/lib/simulator';
import { REGULATORY_TIMELINE } from '@/lib/regulatory';
import { renderToStream } from '@react-pdf/renderer';
import { EnerScanReport } from '@/lib/pdf/EnerScanReport';
import { PremiumReportData, PropertyDataV2, ScoreResultV2, EnergyLetter, PropertyType, HeatingSystem, CoolingSystem, WaterHeatingSystem, WindowType, RenewableSystem, InsulationLevel, BudgetRange, AssessmentObjective, ConfidenceLevel } from '@/lib/domain/energy-assessment';
import React from 'react';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const propertyData: PropertyDataV2 = {
      year: assessment.year,
      area: assessment.area,
      zipcode: assessment.zipcode,
      propertyType: (assessment.propertyType || 'unknown') as PropertyType,
      heating: (assessment.heating || 'unknown') as HeatingSystem,
      cooling: (assessment.cooling || 'unknown') as CoolingSystem,
      waterHeating: (assessment.waterHeating || 'unknown') as WaterHeatingSystem,
      windows: (assessment.windows || 'unknown') as WindowType,
      renewables: (assessment.renewables || 'unknown') as RenewableSystem,
      facadeInsulation: (assessment.facadeInsulation || 'unknown') as InsulationLevel,
      roofInsulation: (assessment.roofInsulation || 'unknown') as InsulationLevel,
      budgetRange: (assessment.budgetRange || 'unknown') as BudgetRange,
      targetLetter: (assessment.targetLetter || 'G') as EnergyLetter,
      objective: (assessment.objective || 'unknown') as AssessmentObjective,
    };

    const scoreResult: ScoreResultV2 = {
      score: assessment.score || 0,
      estimatedLetter: assessment.estimatedLetter as EnergyLetter,
      confidence: (assessment.confidence || 'Media') as ConfidenceLevel,
      climateZone: assessment.climateZone || 'Desconocida',
      penalties: JSON.parse(assessment.penalties || '[]'),
      strengths: JSON.parse(assessment.strengths || '[]'),
      missingData: JSON.parse(assessment.missingData || '[]'),
      explanation: assessment.explanation || '',
    };

    const scenarios = generateScenarios(propertyData, scoreResult);

    const reportData: PremiumReportData = {
      id: assessment.id,
      date: new Date(assessment.createdAt).toLocaleDateString('es-ES'),
      propertyData,
      scoreResult,
      scenarios,
      regulatoryContext: REGULATORY_TIMELINE,
      providerCategories: ["aislamiento", "ventanas", "climatización", "acs", "fotovoltaica", "solar térmica", "certificador"]
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await renderToStream(React.createElement(EnerScanReport, { data: reportData }) as any);

    // Need to cast stream to unknown then ResponseBody because the typings for React PDF Stream can be incomplete in Next
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="enerscan-informe-${assessment.id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
