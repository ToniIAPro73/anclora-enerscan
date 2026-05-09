# Anclora EnergyScan

Anclora EnergyScan es una plataforma de prediagnóstico energético orientativa. Permite a los usuarios introducir datos sobre su vivienda para obtener una estimación de su situación energética y de la normativa vigente aplicable.

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
5. **Adjuntos**: Guarda metadatos y ficheros aportados por assessment en almacenamiento local temporal.
6. **Generador PDF**: Construye y descarga un reporte Premium renderizado mediante `@react-pdf/renderer`.

## Experiencia v0.3
- **Tema:** selector premium Luna/Sol/Ordenador. La preferencia se guarda en `localStorage` y cookie para evitar flashes visuales.
- **Idioma:** selector ES/EN/DE. Los textos principales se sirven desde diccionarios locales y se persisten igual que el tema.
- **Demo:** el botón "Ver ejemplo de valoración" crea una valoración ficticia marcada como demo, sin datos personales.
- **Adjuntos:** el wizard permite arrastrar o seleccionar imágenes, PDF, DOCX y Markdown. Límite: 6 archivos y 8 MB por archivo.

## Partners y proveedores

Anclora EnergyScan prepara una red de proveedores y partners para conectar diagnósticos orientativos con solicitudes de presupuesto o contacto. El sistema distingue entre partners comerciales, proveedores técnicos y leads trazables. Esta funcionalidad no implica recomendación garantizada ni sustitución de servicios técnicos oficiales.

## Demo enriquecida

La demo incluye una vivienda unifamiliar ficticia, documentación aportada de ejemplo, imágenes interiores/exteriores y un supuesto CEE demo sin validez oficial. Estos assets se usan para mostrar el anexo documental del PDF premium.

## Campos del Wizard
El flujo captura objetivo, tipo de inmueble, año, superficie, código postal, orientación, tipo de cubierta, ventanas, aislamiento de fachada y cubierta, ventilación, calefacción, refrigeración, ACS, renovables, presupuesto orientativo, horizonte temporal y aceptación del carácter orientativo.

## Internacionalización
Los diccionarios base viven en:
- `public/locales/es/common.json`
- `public/locales/en/common.json`
- `public/locales/de/common.json`

Para añadir un idioma:
1. Añadir el código en `src/lib/preferences.ts`.
2. Crear `public/locales/{lang}/common.json`.
3. Ampliar `src/lib/i18n.ts` y las etiquetas de PDF en `src/lib/pdf/EnerScanReport.tsx`.
4. Revisar que el selector de idioma lo muestre.

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

`NEXT_PUBLIC_APP_URL` solo se usa como URL pública de referencia cuando aplique. La i18n actual no requiere proveedor externo.

## Limitaciones Legales
- **Orientativo:** Anclora EnergyScan solo emite valoraciones automáticas en base a la información declarada.
- **Sin validez administrativa:** No sustituye al Real Decreto 390/2021 sobre el CEE en España ni normativas autonómicas.

## Roadmap
- [x] Motor Scoring v2 (Más factores).
- [x] Generador PDF nativo y rápido (`@react-pdf/renderer`).
- [x] Tema, idioma, adjuntos y demo premium.
- [ ] Integración completa con Stripe para Premium real.
- [ ] Panel Admin de Proveedores.
