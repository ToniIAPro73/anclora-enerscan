import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateScenarios } from '@/lib/simulator';
import { REGULATORY_TIMELINE } from '@/lib/regulatory';
import { renderToStream } from '@react-pdf/renderer';
import { EnerScanReport } from '@/lib/pdf/EnerScanReport';
import { PremiumReportData, PropertyDataV2, ScoreResultV2, EnergyLetter, PropertyType, HeatingSystem, CoolingSystem, WaterHeatingSystem, WindowType, RenewableSystem, InsulationLevel, BudgetRange, AssessmentObjective, ConfidenceLevel, PropertyOrientation, RoofType, VentilationType, TimelineHorizon } from '@/lib/domain/energy-assessment';
import { normalizeLanguage } from '@/lib/preferences';
import { createReportDataFromPayload, getPublicAssessmentRef, parseStatelessAssessmentId } from '@/lib/stateless-assessment';
import React from 'react';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieLanguage = req.headers.get('cookie')?.match(/enerscan-language=(es|en|de)/)?.[1];
    const language = normalizeLanguage(new URL(req.url).searchParams.get('lang') || cookieLanguage);
    const statelessPayload = parseStatelessAssessmentId(params.id);
    let reportData: PremiumReportData;

    if (statelessPayload) {
      reportData = createReportDataFromPayload(params.id, statelessPayload, language);
    } else {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: { attachments: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const propertyData: PropertyDataV2 = {
      year: assessment.year,
      area: assessment.area,
      zipcode: assessment.zipcode,
      propertyType: (assessment.propertyType || 'unknown') as PropertyType,
      orientation: (assessment.orientation || 'unknown') as PropertyOrientation,
      roofType: (assessment.roofType || 'unknown') as RoofType,
      heating: (assessment.heating || 'unknown') as HeatingSystem,
      cooling: (assessment.cooling || 'unknown') as CoolingSystem,
      waterHeating: (assessment.waterHeating || 'unknown') as WaterHeatingSystem,
      ventilation: (assessment.ventilation || 'unknown') as VentilationType,
      windows: (assessment.windows || 'unknown') as WindowType,
      renewables: (assessment.renewables || 'unknown') as RenewableSystem,
      facadeInsulation: (assessment.facadeInsulation || 'unknown') as InsulationLevel,
      roofInsulation: (assessment.roofInsulation || 'unknown') as InsulationLevel,
      budgetRange: (assessment.budgetRange || 'unknown') as BudgetRange,
      timelineHorizon: (assessment.timelineHorizon || 'unknown') as TimelineHorizon,
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

    reportData = {
      id: assessment.id,
      date: new Date(assessment.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : 'en-US'),
      propertyData,
      scoreResult,
      scenarios,
      regulatoryContext: REGULATORY_TIMELINE,
      providerCategories: ["aislamiento", "ventanas", "climatización", "acs", "fotovoltaica", "solar térmica", "certificador"],
      attachments: assessment.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        path: attachment.path,
        createdAt: attachment.createdAt.toISOString(),
      })),
      language,
      isDemo: assessment.isDemo,
    };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await renderToStream(React.createElement(EnerScanReport, { data: reportData }) as any);

    // Need to cast stream to unknown then ResponseBody because the typings for React PDF Stream can be incomplete in Next
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="enerscan-informe-${getPublicAssessmentRef(params.id)}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
