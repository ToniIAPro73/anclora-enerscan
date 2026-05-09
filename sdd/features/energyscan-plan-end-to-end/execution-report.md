# Execution Report — EnergyScan Plan End-to-End

## Implementado

- Rama creada desde `main`: `feat/energyscan-plan-end-to-end`.
- Normativa actualizada: EPBD deja de presentarse como borrador y pasa a Directiva (UE) 2024/1275 vigente como marco europeo.
- Disclaimers reforzados en README, UI y PDF.
- Scoring v2.1 modularizado por categorías de reglas con `ruleBreakdown`.
- Timeline regulatorio enriquecido con Real Decreto 390/2021, Directiva (UE) 2024/1275, PNIEC, horizonte 2030/2033 y 2050.
- Simulador ampliado con escenarios de envolvente, sistemas, renovables y reforma profunda.
- Capa informativa de ayudas y subvenciones sin prometer elegibilidad.
- Resultados actualizados con normativa, escenarios y ayudas.
- PDF premium actualizado con normativa enriquecida y ayudas.
- Adjuntos endurecidos con MIME/extensión, límite por archivo y límite total.
- Leads con logging estructurado, fallback observable y rate limit en memoria MVP.
- Tests añadidos/ampliados.
- Migración preparada de Prisma a Neon Postgres manteniendo Prisma 7 y driver adapter PostgreSQL.
- Adjuntos pesados preparados para Vercel Blob con fallback local cuando `BLOB_READ_WRITE_TOKEN` no existe.
- Script de migración `npm run migrate:neon` para copiar datos desde SQLite/libSQL a Neon y subir adjuntos locales a Blob si hay token.
- Pantalla `/auth` con Auth.js/NextAuth open source: Sign In, Sign Up, recuperación de contraseña, Google/Gmail y GitHub.
- Ruta `/auth/reset-password` para aplicar tokens de recuperación.
- Modelos Auth.js añadidos (`User`, `Account`, `Session`, `VerificationToken`) y `PasswordResetToken`.
- `Assessment` y `Lead` quedan vinculados opcionalmente a `User` cuando hay sesión.

## No implementado

- Stripe real: fuera de alcance.
- Backoffice completo de usuarios/proveedores: fuera de alcance.
- Envío transaccional de email de recuperación: se deja preparado con `PASSWORD_RESET_WEBHOOK_URL`; en local el enlace se muestra en pantalla/log.
- Parser oficial/productivo de CEE: fuera de alcance.
- Verificación dinámica de convocatorias de ayudas: fuera de alcance y requiere fuentes externas.
- Rate limiting productivo distribuido: pendiente para infraestructura real.

## Comandos ejecutados

- `git pull --ff-only`
- `git checkout -b feat/energyscan-plan-end-to-end`
- `npm test -- --runInBand`
- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `npm run build`
- Demo PDF generado desde `/api/assessment/demo` + `/api/assessment/[id]/pdf`
- `npx ctx7@latest library "Auth.js" ...`
- `npx ctx7@latest docs /nextauthjs/next-auth ...`
- `npx ctx7@latest docs /websites/neon ...`
- `npx ctx7@latest docs /vercel/storage ...`
- `npx prisma generate`
- `npx prisma validate`
- `npx tsc --noEmit`

## Resultado de validación

- `npm test -- --runInBand`: PASS
- `npm test`: PASS
- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS
- `npx prisma generate`: PASS
- `npx prisma validate`: PASS con warning de Prisma sobre `previewFeatures = ["driverAdapters"]` deprecado.
- `npx tsc --noEmit`: PASS
- Demo PDF end-to-end: PASS. PDF A4 generado correctamente, 21 páginas, incluye `DEMO-EZNFOIFQ`, score `75/100`, Real Decreto 390/2021, Directiva (UE) 2024/1275 y bloque de ayudas.

## Comandos no disponibles

- `npm run typecheck`: no existe script específico en `package.json`; se ejecutó `npx tsc --noEmit` como alternativa.

## Riesgos pendientes

- El rate limit de leads es memoria local por instancia.
- Las ayudas son estáticas e informativas.
- El scoring no es certificación oficial.
- El PDF demo con CEE requiere `pdftoppm` disponible en el entorno si se renderizan páginas del CEE.
- Localmente no se han usado las variables de producción de Vercel. Sin `DATABASE_URL` Postgres local, las rutas que necesiten DB intentarán usar el Postgres local de fallback y caerán en fallbacks existentes si aplica.
- Auth.js necesita `AUTH_SECRET` en Vercel y credenciales OAuth reales para habilitar Google/Gmail y GitHub.
- Recuperación de contraseña en producción requiere conectar `PASSWORD_RESET_WEBHOOK_URL` a un proveedor de email transaccional.
- La migración de SQLite a Neon no se ejecutó contra producción porque las variables solo existen en Vercel; quedó implementado el script y validado por TypeScript/build.
