# MVP de app energética inmobiliaria: artefactos funcionales

## Objetivo del producto
La propuesta consiste en una aplicación mobile-first, con experiencia también en portátil, que permita a un usuario introducir datos estructurados de su vivienda, adjuntar documentación y fotografías, obtener una estimación orientativa de su situación energética y descargar un informe en PDF de pago con propuestas de mejora y conexión con proveedores.[cite:63][cite:73][cite:76]

El producto no debe presentarse como sustituto del Certificado de Eficiencia Energética oficial regulado en España, sino como un prediagnóstico o simulador orientativo que ayuda a entender la situación del inmueble, la brecha regulatoria futura y posibles rutas de rehabilitación.[cite:70][cite:73][cite:76]

## Artefacto 1: mapa funcional del MVP

### Módulos principales
| Módulo | Función | Salida principal |
|---|---|---|
| Onboarding | Explicar alcance, límites legales y propuesta de valor | Consentimiento + inicio del flujo |
| Captura de vivienda | Recoger datos del inmueble y adjuntos | Ficha técnica de entrada |
| Motor de scoring | Estimar clase energética orientativa | Letra estimada + confianza |
| Motor normativo | Mostrar situación regulatoria UE/España | Riesgo regulatorio + horizonte temporal |
| Simulador de mejoras | Recomendar actuaciones según presupuesto y objetivo | Escenarios de reforma |
| Marketplace | Mostrar proveedores por tipo de intervención | Leads y solicitudes de presupuesto |
| Checkout informe | Cobrar por descarga del PDF | Pago + generación del informe |
| PDF generator | Generar informe descargable | Informe estructurado |

### Flujo resumido
1. El usuario crea un caso y selecciona el objetivo: conocer la situación actual, alcanzar una letra concreta o preparar venta/alquiler.[cite:73][cite:76]
2. Introduce datos de vivienda, sistemas e instalaciones y puede subir fotos o el CEE si ya existe.[cite:70][cite:73]
3. La app estima una letra orientativa, muestra el contexto normativo y propone paquetes de mejora por presupuesto.[cite:63][cite:77]
4. El usuario puede solicitar presupuesto a proveedores y pagar para descargar el informe completo en PDF.[cite:63][cite:73]

## Artefacto 2: pantallas del MVP

### Pantallas core
| Pantalla | Elementos | Notas de producto |
|---|---|---|
| Home / Landing | Propuesta de valor, CTA, bloque legal breve | Evitar prometer “certificado oficial” |
| Nuevo análisis | Selector de objetivo, tipo de inmueble, ubicación | Primer paso del caso |
| Formulario vivienda | Año, superficie, orientación, tipología, cerramientos | Wizard multi-step |
| Instalaciones | ACS, calefacción, refrigeración, renovables | Campos condicionados |
| Adjuntos | Fotos, CEE PDF, facturas opcionales | OCR/parser si existe CEE |
| Resultado preliminar | Letra estimada, nivel de confianza, gaps de datos | No mostrar falsa precisión |
| Normativa | EPBD 2024/1275, marco español, advertencias | Copia legal auditada |
| Escenarios de mejora | Medidas, coste estimado, ahorro, salto de letra | Tres paquetes recomendados |
| Proveedores | Filtros por intervención y zona | Lead routing |
| Checkout | Precio del informe, consentimiento, pago | Conversión |
| Informe generado | Vista previa y descarga | PDF premium |

## Artefacto 3: esquema del formulario de entrada

### Datos mínimos
- Tipo de inmueble: piso, unifamiliar, adosado, local reconvertido.
- Año de construcción o rango aproximado.
- Superficie útil o construida.
- Municipio o código postal para inferir zona climática.
- Estado de ocupación y uso principal.[cite:70][cite:76]

### Envolvente
- Tipo de fachada, aislamiento conocido o desconocido.
- Tipo de cubierta y exposición.
- Tipo de ventanas, acristalamiento y carpintería.
- Presencia de persianas, protecciones solares y puentes térmicos observables.
- Fotos de ventanas, fachada, techo y elementos representativos.

### Instalaciones
- Sistema de calefacción.
- Sistema de ACS.
- Refrigeración.
- Ventilación.
- Termostatos o control inteligente.
- Fotovoltaica, solar térmica, aerotermia u otras renovables.

### Objetivo económico y regulatorio
- Presupuesto máximo.
- Horizonte temporal: venta en 12 meses, mejora patrimonial, cumplimiento 2030, cumplimiento 2033.
- Letra objetivo deseada.
- Interés en recibir presupuestos de proveedores.

## Artefacto 4: lógica de scoring del MVP

### Versión 1: motor basado en reglas
La primera versión debería apoyarse en reglas expertas y tablas parametrizadas, no en un modelo opaco, porque permite justificar mejor cada salida, auditarla y alinear el producto con fuentes oficiales de certificación y rehabilitación energética.[cite:70][cite:76]

### Entradas del scoring
| Grupo | Variables |
|---|---|
| Geometría | superficie, tipología, planta, exposición |
| Antigüedad | año o rango normativo del edificio |
| Envolvente | muros, huecos, cubierta, sombreamiento |
| Sistemas | calefacción, ACS, refrigeración, control |
| Renovables | FV, solar térmica, aerotermia, biomasa |
| Evidencias | fotos, CEE adjunto, datos incompletos |

### Salidas del scoring
- Letra estimada orientativa.
- Intervalo de confianza: alta, media o baja.
- Factores que más penalizan la clasificación.
- Factores que faltan y mejorarían la precisión.

### Regla de transparencia
Toda clasificación debe acompañarse de un texto del tipo: “Estimación orientativa basada en datos facilitados por el usuario. No sustituye al CEE oficial regulado por el Real Decreto 390/2021”.[cite:70][cite:73]

## Artefacto 5: motor normativo

### Qué debe mostrar
El módulo legal debe distinguir entre normativa oficial vigente en España sobre certificación energética y objetivos regulatorios europeos que requieren transposición o desarrollo adicional en cada Estado miembro.[cite:63][cite:65][cite:76]

### Mensajes clave recomendados
| Mensaje | Base |
|---|---|
| El CEE es obligatorio para vender o alquilar edificios o partes de edificios existentes en España | [cite:73][cite:76] |
| La Directiva (UE) 2024/1275 impulsa una senda de renovación del parque edificatorio | [cite:63][cite:65] |
| Para residencial, el marco europeo se comunica en términos de reducción del uso medio de energía primaria; buena parte del mercado también lo interpreta como senda hacia E y D, pero conviene mostrarlo con cautela jurídica | [cite:53][cite:67][cite:77] |
| La app debe evitar mensajes absolutos si la transposición española concreta no está cerrada o puede cambiar | [cite:63][cite:72] |

### UX legal recomendada
- Semáforo regulatorio: verde, ámbar, rojo.
- Línea temporal: hoy, 2030, 2033, 2050.
- Estado de la fuente: UE, España vigente, España en desarrollo.

## Artefacto 6: simulador de mejoras

### Escenarios a generar
| Escenario | Objetivo | Ejemplo |
|---|---|---|
| Básico | Mejorar confort y reducir consumo con poca inversión | termostato, LED, sellados, ajustes |
| Intermedio | Intentar subir un nivel con presupuesto medio | ventanas, ACS, mejora parcial de climatización |
| Profundo | Buscar una letra objetivo concreta | envolvente + sistemas + renovables |

### Salida por escenario
- Medidas incluidas.
- Coste aproximado en rango, no cifra cerrada.
- Impacto estimado en letra.
- Ahorro anual orientativo.
- Dependencias técnicas y advertencias.

### Reglas de seguridad del producto
No prometer que una medida concreta garantiza una letra final exacta, porque la calificación oficial depende de metodología reconocida, visita técnica y datos reales del inmueble.[cite:70][cite:76]

## Artefacto 7: marketplace de proveedores

### Funcionalidad mínima
- Catálogo por categoría: aislamiento, ventanas, climatización, ACS, FV, certificadores energéticos.
- Filtro geográfico por provincia o radio.
- Formulario de solicitud de presupuesto con consentimiento.
- Envío de lead estructurado al proveedor.

### Modelo de datos mínimo del proveedor
| Campo | Descripción |
|---|---|
| Nombre comercial | Identificación |
| Categorías | Tipos de actuación |
| Zona de cobertura | Provincia o CP |
| Certificaciones | Opcional |
| Valoración | Interna o futura |
| SLA de respuesta | Tiempo objetivo |

## Artefacto 8: checkout y monetización

### Esquema recomendado
- Resultado básico gratuito: letra estimada, brecha de datos y una recomendación genérica.
- Pago único por informe premium: escenarios, contexto normativo, coste estimado y proveedores.
- Upsell a asesor experto o visita técnica.

### Mensajes de cumplimiento
- El pago se realiza por un informe orientativo y personalizado.
- No se vende un certificado oficial.
- El usuario acepta términos y limitaciones metodológicas antes de pagar.

## Artefacto 9: estructura del PDF premium

### Secciones del informe
1. Resumen ejecutivo.
2. Datos declarados por el usuario.
3. Clasificación energética estimada y confianza.
4. Contexto normativo aplicable.
5. Escenarios de mejora por presupuesto.
6. Costes aproximados y ahorro esperado.
7. Proveedores sugeridos.
8. Avisos legales y limitaciones.

### Diseño de salida
El PDF debería estar pensado para lectura móvil y escritorio, con una primera página muy comercial y páginas interiores más técnicas, usando gráficos sencillos de brecha energética, timeline regulatorio y comparativa de escenarios.[cite:63][cite:73]

## Artefacto 10: arquitectura funcional del sistema

### Bloques backend
| Servicio | Función |
|---|---|
| API de casos | Crear y actualizar expedientes |
| Motor de scoring | Estimar letra y confianza |
| Parser documental | Extraer datos de CEE PDF |
| Recomendador | Construir escenarios de mejora |
| Compliance service | Resolver mensajes normativos por fecha y país |
| Provider routing | Gestionar solicitudes a proveedores |
| Billing | Cobro y facturación |
| PDF service | Renderizar informe final |

### Stack inicial razonable
- Frontend web responsive o PWA mobile-first.
- Backend API en Python o TypeScript.
- Base de datos relacional para casos, proveedores y reglas.
- Almacenamiento de archivos para CEE y fotos.
- Motor de plantillas para PDF.

## Artefacto 11: disclaimers y copy de cumplimiento

### Textos mínimos
- “Este resultado es una estimación orientativa basada en la información declarada.”[cite:70][cite:76]
- “No sustituye al Certificado de Eficiencia Energética oficial exigido por la normativa española.”[cite:73][cite:76]
- “La información regulatoria mostrada combina normativa española vigente y objetivos europeos sujetos a desarrollo y transposición.”[cite:63][cite:65][cite:72]
- “Los costes de mejora son aproximados y deberán confirmarse con presupuesto profesional.”

## Artefacto 12: roadmap del MVP

### Fase 1
- Wizard de captura.
- Scoring basado en reglas.
- Bloque normativo explicativo.
- PDF premium.
- Marketplace básico manual.

### Fase 2
- Parser automático de CEE.
- OCR sobre facturas y documentos.
- Matching avanzado de proveedores.
- Modelos predictivos entrenados con casos históricos.

### Fase 3
- Panel profesional para agentes, arquitectos y certificadores.
- Versionado por comunidad autónoma.
- Benchmark de inmuebles comparables.
- API white-label para partners.

## Recomendación de posicionamiento
El mejor posicionamiento inicial no es “app que certifica”, sino “plataforma de prediagnóstico energético, preparación regulatoria y activación de rehabilitación”, porque encaja mejor con el marco legal vigente y reduce riesgo reputacional y regulatorio.[cite:63][cite:70][cite:73]
