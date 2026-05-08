# Anclora EnerScan

EnerScan es una plataforma de prediagnóstico energético orientativa. Permite a los usuarios introducir datos sobre su vivienda para obtener una estimación de su situación energética y de la normativa vigente aplicable.

**Este proyecto NO genera un Certificado de Eficiencia Energética oficial.**

## Stack
- Next.js 14
- TypeScript
- Prisma + SQLite (configurable para Postgres)
- Tailwind CSS
- React Hook Form + Zod
- @react-pdf/renderer

## Arquitectura
La aplicación sigue un flujo Wizard -> API -> Resultados:
1. **Landing/Wizard**: Captura datos estructurales y de sistemas de la vivienda (`src/components/AssessmentWizard.tsx`).
2. **API**: Valida la información mediante esquemas estrictos de `Zod` y persiste el análisis inicial (`src/app/api/assessment/route.ts`).
3. **Scoring**: Un motor propio evalúa penalizaciones y puntos fuertes según datos, como el año o el aislamiento (`src/lib/scoring.ts`).
4. **Resultados**: Muestra clasificación orientativa, zonas de riesgo y proveedores recomendados.
5. **Generador PDF**: Construye y descarga un reporte Premium renderizado mediante `@react-pdf/renderer`.

## Instalación
1. Clonar el repositorio
2. `npm install`
3. Generar cliente Prisma: `npx prisma generate`
4. Crear la base de datos: `npx prisma migrate dev`
5. Levantar el entorno local: `npm run dev`

## Variables de Entorno
Crea un archivo `.env` basado en `.env.example`:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENABLE_DEMO_PREMIUM="true"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

## Limitaciones Legales
- **Orientativo:** EnerScan solo emite valoraciones automáticas en base a la información declarada.
- **Sin validez administrativa:** No sustituye al Real Decreto 390/2021 sobre el CEE en España ni normativas autonómicas.

## Roadmap
- [x] Motor Scoring v2 (Más factores).
- [x] Generador PDF nativo y rápido (`@react-pdf/renderer`).
- [ ] Integración completa con Stripe para Premium real.
- [ ] Panel Admin de Proveedores.
