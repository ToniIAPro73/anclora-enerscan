import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id }
    });

    if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // In a real app, we would use a specialized template. 
    // For the MVP, we'll navigate to the results page and print it, 
    // or better, render a dedicated PDF route.
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Construct the URL to the results page (assuming it's accessible internally)
    // For MVP local dev, we can use the absolute URL if we know where the server is running.
    // Or we can just generate a simple HTML here.
    
    const html = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=DM+Sans&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'DM Sans', sans-serif; background: white; color: black; padding: 40px; }
            h1 { font-family: 'Space Grotesk', sans-serif; color: #00DC82; }
            .card { border: 1px solid #eee; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .letter { font-size: 80px; font-weight: bold; color: #00DC82; text-align: center; }
            .footer { font-size: 10px; color: #777; margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>EnerScan - Informe Premium</h1>
          <div className="card">
            <h2>Clasificación Estimada</h2>
            <div class="letter">${assessment.estimatedLetter}</div>
            <p>Confianza: ${assessment.confidence}</p>
          </div>
          <div className="card">
            <h2>Datos de la Vivienda</h2>
            <p>Superficie: ${assessment.area} m²</p>
            <p>Año: ${assessment.year}</p>
            <p>Ubicación: CP ${assessment.zipcode}</p>
          </div>
          <div className="footer">
            Estimación orientativa. No sustituye al Certificado de Eficiencia Energética oficial (R.D. 390/2021).
          </div>
        </body>
      </html>
    `;

    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="EnerScan_Informe_${assessment.id}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
