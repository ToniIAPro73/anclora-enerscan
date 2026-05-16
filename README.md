# Anclora EnergyScan

Anclora EnergyScan es una plataforma de prediagnóstico energético orientativa. Permite a los usuarios introducir datos sobre su vivienda para obtener una estimación de su situación energética y de la normativa vigente aplicable.

**Este proyecto NO genera un Certificado de Eficiencia Energética oficial ni documentación con validez administrativa.**

## Stack
- Next.js 14
- TypeScript
- Prisma + Neon Postgres en producción, con compatibilidad local heredada para SQLite/libSQL
- Vercel Blob para adjuntos pesados en producción
- Auth.js/NextAuth open source para credenciales y OAuth Google/GitHub
- Tailwind CSS
- React Hook Form + Zod
- @react-pdf/renderer

## Arquitectura
La aplicación sigue un flujo Wizard -> API -> Resultados:
1. **Landing/Wizard**: Captura datos estructurales y de sistemas de la vivienda (`src/components/AssessmentWizard.tsx`).
2. **API**: Valida la información mediante esquemas estrictos de `Zod` y persiste el análisis inicial (`src/app/api/assessment/route.ts`).
3. **Scoring**: Un motor propio v2.1 evalúa reglas trazables por categoría: envolvente, sistemas, renovables, clima, tipología y calidad de datos (`src/lib/scoring.ts`).
4. **Resultados**: Muestra clasificación orientativa, score, confianza, brecha regulatoria, ayudas informativas, escenarios y proveedores recomendados.
5. **Adjuntos**: Guarda metadatos en Prisma y ficheros aportados en Vercel Blob si está configurado, con fallback local.
6. **Generador PDF**: Construye y descarga un reporte Premium renderizado mediante `@react-pdf/renderer`.
7. **Monetización Premium**: Stripe Checkout desbloquea el informe Premium mediante pago único. El PDF queda bloqueado hasta que el webhook confirma `paidAt`.

## Experiencia v0.3
- **Tema:** selector premium Luna/Sol/Ordenador. La preferencia se guarda en `localStorage` y cookie para evitar flashes visuales.
- **Idioma, moneda y unidades:** selector ES/EN/DE, EUR/GBP y m²/sq ft. ES y DE activan EUR + m²; EN activa GBP + sq ft. Las preferencias se persisten en `localStorage` y cookies para que el PDF use el mismo contexto.
- **Demo:** el botón "Ver ejemplo de valoración" crea una valoración ficticia marcada como demo, sin datos personales.
- **Adjuntos:** el wizard permite arrastrar o seleccionar PDF, JPG, PNG y WEBP. Límite: 6 archivos, 10 MB por archivo y 50 MB acumulados por valoración.
- **Normativa:** el contexto distingue Real Decreto 390/2021, Directiva (UE) 2024/1275, PNIEC y horizontes europeos sin convertirlos en obligaciones individuales directas.

## Partners y proveedores

Anclora EnergyScan prepara una red de proveedores y partners para conectar diagnósticos orientativos con solicitudes de presupuesto o contacto. El sistema distingue entre partners comerciales, proveedores técnicos y leads trazables. Esta funcionalidad no implica recomendación garantizada ni sustitución de servicios técnicos oficiales.

## Demo enriquecida

La demo incluye una vivienda unifamiliar ficticia, documentación aportada de ejemplo, imágenes interiores/exteriores y un supuesto CEE demo sin validez oficial. Estos assets se usan para mostrar el anexo documental del PDF premium.

El informe premium puede generarse en español, inglés o alemán con moneda y unidades acordes a la preferencia activa. El CEE aportado por el usuario se conserva como documento español: su contenido no se traduce y mantiene euros/m² cuando se anexan sus páginas originales.

## Neon, Blob y autenticación

La base de datos de producción está preparada para Neon Postgres manteniendo Prisma como ORM. Los adjuntos pesados se guardan en Vercel Blob cuando existe `BLOB_READ_WRITE_TOKEN`; en local se conserva el fallback a disco.

La autenticación no usa Neon Auth. Se implementa con Auth.js/NextAuth, Prisma Adapter, credenciales propias con hash `scrypt`, recuperación por token y login social con Google/Gmail y GitHub. Las variables OAuth deben configurarse en Vercel (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`).

### Configuración OAuth

Callback URLs esperadas:
- **Google Local:** `http://localhost:3000/api/auth/callback/google`
- **GitHub Local:** `http://localhost:3000/api/auth/callback/github`
- **Vercel/Production:** `https://<dominio>/api/auth/callback/<provider>`

Aliases compatibles (opcionales):
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- GitHub: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

Para migrar datos heredados desde SQLite/libSQL a Neon:

```bash
SQLITE_DATABASE_URL="file:./dev.db" DATABASE_URL="postgresql://..." BLOB_READ_WRITE_TOKEN="..." npm run migrate:neon
```

Si `BLOB_READ_WRITE_TOKEN` está presente, el script sube adjuntos locales existentes a Blob y guarda rutas `blob:...` en Prisma. Si no existe, conserva las rutas locales.

## Estimaciones económicas orientativas

El PDF Premium y la pantalla de resultados incluyen una primera estimación económica por escenario de mejora. El motor usa un catálogo interno versionado de partidas, fuentes y medidas energéticas, preparado para futuras ingestas BC3/FIEBDC, BEDEC, CYPE, PREOC/PREMETI, IVE o BCCA. Los importes se muestran siempre como rango orientativo y no constituyen presupuesto cerrado, oferta vinculante, medición profesional ni CEE oficial.

Para sembrar el catálogo en Neon:

```bash
DATABASE_URL="postgresql://..." npm run db:seed:prices
```

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
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require&channel_binding=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENABLE_DEMO_PREMIUM="true"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_PREMIUM=""
NEXT_PUBLIC_PREMIUM_PRICE_EUR="9.90"
NEXT_PUBLIC_PREMIUM_STANDARD_PRICE_EUR="14.90"
BLOB_READ_WRITE_TOKEN=""
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
EUR_GBP_RATE="0.86"
NEXT_PUBLIC_EUR_GBP_RATE="0.86"
PASSWORD_RESET_WEBHOOK_URL=""
SQLITE_DATABASE_URL="file:./dev.db"
```

`NEXT_PUBLIC_APP_URL` y `AUTH_URL` se usan para construir enlaces absolutos. `EUR_GBP_RATE`/`NEXT_PUBLIC_EUR_GBP_RATE` fijan el cambio orientativo EUR -> GBP usado en UI/PDF. `PASSWORD_RESET_WEBHOOK_URL` es opcional: si no existe, el enlace de recuperación solo se muestra en local y se registra en logs de desarrollo.

## Stripe Premium

El flujo Premium usa `/api/checkout` para crear una sesión de pago único y `/api/webhook/stripe` para confirmar el pago. El cliente nunca marca un análisis como pagado: el desbloqueo real depende de `Assessment.paidAt`, escrito desde el webhook `checkout.session.completed`.

Precio inicial: 9,90 € lanzamiento, con 14,90 € como referencia estándar. Si `STRIPE_PRICE_PREMIUM` está configurado se usa ese Price ID; si no, la API crea `price_data` dinámico por 990 céntimos EUR.

Webhook local recomendado:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Configura el secreto recibido en `STRIPE_WEBHOOK_SECRET`. El informe sigue siendo un prediagnóstico orientativo y no sustituye al CEE oficial.

## Limitaciones Legales
- **Orientativo:** Anclora EnergyScan solo emite valoraciones automáticas en base a la información declarada.
- **Sin validez administrativa:** No sustituye al Certificado de Eficiencia Energética oficial regulado en España por el Real Decreto 390/2021, no emite certificados oficiales y no puede registrarse ante administraciones.
- **Contexto normativo:** Las referencias a la Directiva (UE) 2024/1275, PNIEC, ayudas o subvenciones son informativas y pueden variar según transposición, desarrollo normativo, convocatorias y requisitos oficiales.
- **Ayudas:** No se garantiza elegibilidad, disponibilidad ni importes. Cualquier ayuda o bonificación debe verificarse en fuentes oficiales estatales, autonómicas o municipales.

## Roadmap
- [x] Motor Scoring v2 (Más factores).
- [x] Generador PDF nativo y rápido (`@react-pdf/renderer`).
- [x] Tema, idioma, adjuntos y demo premium.
- [x] Integración Stripe Checkout para Premium real.
- [ ] Panel Admin de Proveedores.
