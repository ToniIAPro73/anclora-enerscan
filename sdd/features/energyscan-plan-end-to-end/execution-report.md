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
- `Assessment` y `Lead` quedan vinculados opcionalmente a `User` when hay sesión.
- **Resolución de incompatibilidad de Prisma v7**: Implementado Proxy para `PrismaClient` en `src/lib/prisma.ts` que actúa como fallback resiliente durante el build y ejecuciones locales sin PostgreSQL.
- **Optimización de build**: Forzado el dinamismo (`force-dynamic`) en todas las rutas críticas (API y páginas dinámicas) para asegurar la compatibilidad con el entorno de build de Next.js y el esquema de base de datos PostgreSQL.

## No implementado

- Stripe real: fuera de alcance.
- Backoffice completo de usuarios/proveedores: fuera de alcance.
- Envío transaccional de email de recuperación: se deja preparado con `PASSWORD_RESET_WEBHOOK_URL`; en local el enlace se muestra en pantalla/log.
- Parser oficial/productivo de CEE: fuera de alcance.
- Verificación dinámica de convocatorias de ayudas: fuera de alcance y requiere fuentes externas.
- Rate limiting productivo distribuido: pendiente para infraestructura real.

## Comandos ejecutados

- `git checkout -b feat/energyscan-plan-end-to-end`
- `npm test -- --runInBand`
- `npm run lint`
- `npm run build`

## Resultado de validación

- `npm test -- --runInBand`: PASS (`20` suites, `84` tests).
- `npm run lint`: PASS con avisos existentes en `src/components/PropertyMap.tsx` sobre dependencias de `useEffect`.
- `npm run build`: PASS.

No se ejecutó `git pull --ff-only` porque el árbol local ya tenía cambios ajenos sin commitear (`Captura1.png` y un prompt no trackeado) y se priorizó no interferir con trabajo local existente.

## Riesgos pendientes

- El rate limit de leads es memoria local por instancia.
- Las ayudas son estáticas e informativas.
- El scoring no es certificación oficial.
- La migración de SQLite a Neon debe ejecutarse en el entorno de despliegue con las credenciales finales.
