# Test Plan v1

## Automatizado
- `npm run lint`
- `npm test`
- `npm run build`
- Tests de scoring v2 existentes.
- Tests nuevos de validación de adjuntos y normalización de preferencias.

## Manual
- Revisar landing, wizard y resultado en tema oscuro, claro y sistema.
- Cambiar idioma ES/EN/DE y verificar persistencia tras recarga.
- Crear una valoración con campos ampliados.
- Subir imagen, PDF, DOCX o Markdown; verificar listado, descarga y eliminación.
- Abrir `Ver ejemplo de valoración` y confirmar que el resultado indica demo.
- Descargar PDF y verificar nuevas secciones y disclaimer.

## Criterios de aceptación
- No se rompe el flujo v0.2.
- Adjuntos inválidos devuelven error claro.
- El PDF conserva aviso legal y marca la demo cuando aplica.
- Build de producción termina correctamente.
