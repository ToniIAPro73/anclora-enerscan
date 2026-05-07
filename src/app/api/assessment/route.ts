import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScore } from '@/lib/scoring';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Calculate score
    const result = calculateScore({
      year: data.year,
      propertyType: data.propertyType,
      heating: data.heating,
      windows: data.windows,
      renewables: data.renewables
    });

    // Save to DB
    const assessment = await prisma.assessment.create({
      data: {
        objective: data.objective,
        propertyType: data.propertyType,
        year: data.year,
        area: data.area,
        zipcode: data.zipcode,
        heating: data.heating,
        cooling: data.cooling || 'none',
        waterHeating: data.waterHeating || 'gas',
        windows: data.windows,
        renewables: data.renewables,
        estimatedLetter: result.estimatedLetter,
        confidence: result.confidence,
        penalties: JSON.stringify(result.penalties)
      }
    });

    return NextResponse.json({ id: assessment.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}
