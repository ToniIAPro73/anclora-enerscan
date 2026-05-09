import React from 'react';
import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { PremiumReportData } from '../domain/energy-assessment';
import { getLegalDisclaimer } from '../i18n';
import { formatFileSize } from '../attachments';
import { getPublicAssessmentRef } from '../stateless-assessment';

const labels = {
  es: {
    title: 'Anclora EnergyScan Premium Report',
    subtitle: 'Prediagnóstico Energético Orientativo',
    demo: 'Informe demo con datos ficticios',
    rating: 'Calificación Estimada',
    confidence: 'Confianza',
    zone: 'Zona Climática',
    data: 'Datos Declarados',
    yearArea: 'Año / Superficie',
    zipcode: 'Código Postal',
    orientation: 'Orientación / Cubierta',
    systems: 'Sistemas',
    envelope: 'Envolvente',
    findings: 'Resumen de Hallazgos',
    penalties: 'Penalizaciones principales:',
    strengths: 'Fortalezas principales:',
    scenarios: 'Escenarios de Mejora',
    regulation: 'Contexto Normativo',
    subsidies: 'Ayudas y subvenciones potencialmente relevantes',
    attachments: 'Documentación aportada',
    attachmentsNote: 'Los archivos se registran como soporte documental, pero no han sido analizados automáticamente.',
    annexTitle: 'Anexo',
    userInfoAnnex: 'Información suministrada por el usuario',
    documentsAnnex: 'Documentos aportados',
    noDocuments: 'No se aportaron documentos adicionales.',
    documentsCount: 'Cada documento se incluye en una página separada de este anexo.',
    documentPage: 'Documento aportado',
    fileName: 'Nombre',
    fileType: 'Tipo',
    fileSize: 'Tamaño',
    previewUnavailable: 'El contenido de este formato queda registrado como documento aportado, pero no se convierte automáticamente dentro del informe.',
  },
  en: {
    title: 'Anclora EnergyScan Premium Report',
    subtitle: 'Indicative Energy Pre-assessment',
    demo: 'Demo report with fictitious data',
    rating: 'Estimated Rating',
    confidence: 'Confidence',
    zone: 'Climate Zone',
    data: 'Declared Data',
    yearArea: 'Year / Area',
    zipcode: 'Postcode',
    orientation: 'Orientation / Roof',
    systems: 'Systems',
    envelope: 'Envelope',
    findings: 'Findings Summary',
    penalties: 'Main penalties:',
    strengths: 'Main strengths:',
    scenarios: 'Improvement Scenarios',
    regulation: 'Regulatory Context',
    subsidies: 'Potentially relevant grants and subsidies',
    attachments: 'Submitted documentation',
    attachmentsNote: 'Files are registered as supporting documentation, but have not been automatically analyzed.',
    annexTitle: 'Appendix',
    userInfoAnnex: 'Information supplied by the user',
    documentsAnnex: 'Submitted documents',
    noDocuments: 'No additional documents were submitted.',
    documentsCount: 'Each document is included on a separate page of this appendix.',
    documentPage: 'Submitted document',
    fileName: 'Name',
    fileType: 'Type',
    fileSize: 'Size',
    previewUnavailable: 'The content of this format is registered as a submitted document, but is not automatically converted inside the report.',
  },
  de: {
    title: 'Anclora EnergyScan Premium Report',
    subtitle: 'Orientierende energetische Voreinschätzung',
    demo: 'Demo-Bericht mit fiktiven Daten',
    rating: 'Geschätzte Klasse',
    confidence: 'Vertrauen',
    zone: 'Klimazone',
    data: 'Angegebene Daten',
    yearArea: 'Baujahr / Fläche',
    zipcode: 'Postleitzahl',
    orientation: 'Ausrichtung / Dach',
    systems: 'Systeme',
    envelope: 'Gebäudehülle',
    findings: 'Zusammenfassung',
    penalties: 'Wesentliche Abzüge:',
    strengths: 'Wesentliche Stärken:',
    scenarios: 'Verbesserungsszenarien',
    regulation: 'Regulatorischer Kontext',
    subsidies: 'Potentiell relevante Förderungen',
    attachments: 'Eingereichte Dokumentation',
    attachmentsNote: 'Dateien werden als Nachweis erfasst, aber nicht automatisch analysiert.',
    annexTitle: 'Anhang',
    userInfoAnnex: 'Vom Nutzer bereitgestellte Informationen',
    documentsAnnex: 'Eingereichte Dokumente',
    noDocuments: 'Es wurden keine zusätzlichen Dokumente eingereicht.',
    documentsCount: 'Jedes Dokument wird auf einer separaten Seite dieses Anhangs aufgeführt.',
    documentPage: 'Eingereichtes Dokument',
    fileName: 'Name',
    fileType: 'Typ',
    fileSize: 'Grösse',
    previewUnavailable: 'Der Inhalt dieses Formats wird als eingereichtes Dokument registriert, aber nicht automatisch in den Bericht konvertiert.',
  },
} as const;

const valueLabels: Record<string, Record<string, string>> = {
  es: {
    flat: 'Piso / apartamento',
    house: 'Casa unifamiliar',
    terraced: 'Adosado',
    penthouse: 'Ático',
    ground_floor: 'Planta baja',
    north: 'Norte',
    south: 'Sur',
    east: 'Este',
    west: 'Oeste',
    mixed: 'Mixta',
    flat_roof: 'Cubierta plana',
    pitched: 'Cubierta inclinada',
    shared: 'Cubierta comunitaria',
    gas: 'Gas',
    electric: 'Eléctrico',
    heat_pump: 'Bomba de calor / aerotermia',
    biomass: 'Biomasa',
    none: 'Ninguno',
    split: 'Split',
    central: 'Centralizado',
    natural: 'Natural',
    mechanical: 'Mecánica',
    heat_recovery: 'Recuperación de calor',
    single: 'Cristal simple',
    double: 'Doble acristalamiento',
    triple: 'Triple / bajo emisivo',
    partial: 'Parcial',
    good: 'Bueno',
    photovoltaic: 'Fotovoltaica',
    solar_thermal: 'Solar térmica',
    both: 'Fotovoltaica y solar térmica',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    immediate: 'Inmediato',
    six_months: 'Próximos 6 meses',
    one_year: 'Antes de 12 meses',
    three_years: '1-3 años',
    current_state: 'Conocer situación actual',
    target_letter: 'Alcanzar una letra concreta',
    sale_rent: 'Preparar venta o alquiler',
    comfort: 'Mejorar confort',
    regulatory_readiness: 'Preparación regulatoria',
    unknown: 'No declarado',
  },
  en: {
    flat: 'Apartment',
    house: 'Detached house',
    terraced: 'Terraced house',
    penthouse: 'Penthouse',
    ground_floor: 'Ground floor',
    north: 'North',
    south: 'South',
    east: 'East',
    west: 'West',
    mixed: 'Mixed',
    flat_roof: 'Flat roof',
    pitched: 'Pitched roof',
    shared: 'Shared roof',
    gas: 'Gas',
    electric: 'Electric',
    heat_pump: 'Heat pump',
    biomass: 'Biomass',
    none: 'None',
    split: 'Split unit',
    central: 'Central system',
    natural: 'Natural',
    mechanical: 'Mechanical',
    heat_recovery: 'Heat recovery',
    single: 'Single glazing',
    double: 'Double glazing',
    triple: 'Triple / low-e glazing',
    partial: 'Partial',
    good: 'Good',
    photovoltaic: 'Photovoltaic',
    solar_thermal: 'Solar thermal',
    both: 'Photovoltaic and solar thermal',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    immediate: 'Immediate',
    six_months: 'Next 6 months',
    one_year: 'Within 12 months',
    three_years: '1-3 years',
    current_state: 'Understand current state',
    target_letter: 'Reach a target rating',
    sale_rent: 'Prepare sale or rental',
    comfort: 'Improve comfort',
    regulatory_readiness: 'Regulatory readiness',
    unknown: 'Not declared',
  },
  de: {
    flat: 'Wohnung',
    house: 'Einfamilienhaus',
    terraced: 'Reihenhaus',
    penthouse: 'Penthouse',
    ground_floor: 'Erdgeschoss',
    north: 'Nord',
    south: 'Süd',
    east: 'Ost',
    west: 'West',
    mixed: 'Gemischt',
    flat_roof: 'Flachdach',
    pitched: 'Schrägdach',
    shared: 'Gemeinschaftsdach',
    gas: 'Gas',
    electric: 'Elektrisch',
    heat_pump: 'Wärmepumpe',
    biomass: 'Biomasse',
    none: 'Keine',
    split: 'Splitgerät',
    central: 'Zentrales System',
    natural: 'Natürlich',
    mechanical: 'Mechanisch',
    heat_recovery: 'Wärmerückgewinnung',
    single: 'Einfachverglasung',
    double: 'Doppelverglasung',
    triple: 'Dreifachverglasung',
    partial: 'Teilweise',
    good: 'Gut',
    photovoltaic: 'Photovoltaik',
    solar_thermal: 'Solarthermie',
    both: 'Photovoltaik und Solarthermie',
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    immediate: 'Sofort',
    six_months: 'Nächste 6 Monate',
    one_year: 'Innerhalb von 12 Monaten',
    three_years: '1-3 Jahre',
    current_state: 'Aktuellen Zustand verstehen',
    target_letter: 'Zielklasse erreichen',
    sale_rent: 'Verkauf oder Vermietung vorbereiten',
    comfort: 'Komfort verbessern',
    regulatory_readiness: 'Regulatorische Vorbereitung',
    unknown: 'Nicht angegeben',
  },
};

const annexFieldLabels = {
  es: {
    objective: 'Objetivo',
    propertyType: 'Tipo de inmueble',
    year: 'Año de construcción',
    area: 'Superficie útil',
    zipcode: 'Código postal',
    orientation: 'Orientación principal',
    roofType: 'Tipo de cubierta',
    windows: 'Ventanas',
    facadeInsulation: 'Aislamiento de fachada',
    roofInsulation: 'Aislamiento de cubierta',
    heating: 'Calefacción',
    cooling: 'Refrigeración',
    waterHeating: 'Agua caliente sanitaria',
    ventilation: 'Ventilación',
    renewables: 'Renovables',
    budgetRange: 'Presupuesto orientativo',
    timelineHorizon: 'Horizonte temporal',
    targetLetter: 'Letra objetivo',
  },
  en: {
    objective: 'Objective',
    propertyType: 'Property type',
    year: 'Construction year',
    area: 'Usable area',
    zipcode: 'Postcode',
    orientation: 'Main orientation',
    roofType: 'Roof type',
    windows: 'Windows',
    facadeInsulation: 'Facade insulation',
    roofInsulation: 'Roof insulation',
    heating: 'Heating',
    cooling: 'Cooling',
    waterHeating: 'Domestic hot water',
    ventilation: 'Ventilation',
    renewables: 'Renewables',
    budgetRange: 'Indicative budget',
    timelineHorizon: 'Desired timeline',
    targetLetter: 'Target rating',
  },
  de: {
    objective: 'Ziel',
    propertyType: 'Immobilientyp',
    year: 'Baujahr',
    area: 'Nutzfläche',
    zipcode: 'Postleitzahl',
    orientation: 'Hauptausrichtung',
    roofType: 'Dachtyp',
    windows: 'Fenster',
    facadeInsulation: 'Fassadendämmung',
    roofInsulation: 'Dachdämmung',
    heating: 'Heizung',
    cooling: 'Kühlung',
    waterHeating: 'Warmwasser',
    ventilation: 'Lüftung',
    renewables: 'Erneuerbare Energien',
    budgetRange: 'Orientierungsbudget',
    timelineHorizon: 'Gewünschter Zeitraum',
    targetLetter: 'Zielklasse',
  },
} as const;

function labelValue(value: string | undefined, language: 'es' | 'en' | 'de') {
  if (!value) return valueLabels[language].unknown;
  const key = value === 'flat' ? 'flat_roof' : value;
  return valueLabels[language][key] || value;
}

function labelPropertyType(value: string | undefined, language: 'es' | 'en' | 'de') {
  if (!value) return valueLabels[language].unknown;
  return valueLabels[language][value] || value;
}

function buildUserDataRows(data: PremiumReportData, language: 'es' | 'en' | 'de') {
  const p = data.propertyData;
  const fields = annexFieldLabels[language];
  return [
    [fields.objective, labelValue(p.objective, language)],
    [fields.propertyType, labelPropertyType(p.propertyType, language)],
    [fields.year, String(p.year)],
    [fields.area, `${p.area} m²`],
    [fields.zipcode, p.zipcode],
    [fields.orientation, labelValue(p.orientation, language)],
    [fields.roofType, labelValue(p.roofType, language)],
    [fields.windows, labelValue(p.windows, language)],
    [fields.facadeInsulation, labelValue(p.facadeInsulation, language)],
    [fields.roofInsulation, labelValue(p.roofInsulation, language)],
    [fields.heating, labelValue(p.heating, language)],
    [fields.cooling, labelValue(p.cooling, language)],
    [fields.waterHeating, labelValue(p.waterHeating, language)],
    [fields.ventilation, labelValue(p.ventilation, language)],
    [fields.renewables, labelValue(p.renewables, language)],
    [fields.budgetRange, labelValue(p.budgetRange, language)],
    [fields.timelineHorizon, labelValue(p.timelineHorizon, language)],
    [fields.targetLetter, p.targetLetter || valueLabels[language].unknown],
  ];
}

function formatDocumentsCount(count: number, language: 'es' | 'en' | 'de') {
  const suffix = labels[language].documentsCount;

  if (language === 'en') {
    return `${count} submitted ${count === 1 ? 'document' : 'documents'}. ${suffix}`;
  }

  if (language === 'de') {
    return `${count} ${count === 1 ? 'eingereichtes Dokument' : 'eingereichte Dokumente'}. ${suffix}`;
  }

  return `${count} ${count === 1 ? 'documento aportado' : 'documentos aportados'}. ${suffix}`;
}

function chunkPairs<T>(items: T[]): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    chunks.push(items.slice(index, index + 2));
  }
  return chunks;
}

export const EnerScanReport = ({ data }: { data: PremiumReportData }) => {
  const language = data.language || 'es';
  const t = labels[language];
  const reportRef = data.publicRef || getPublicAssessmentRef(data.id);
  const attachments = data.attachments || [];
  const imageAttachments = attachments.filter((attachment) => attachment.previewDataUri);
  const ceeAttachments = attachments.filter((attachment) => attachment.category === 'CEE');
  const otherAttachments = attachments.filter((attachment) => !attachment.previewDataUri && attachment.category !== 'CEE');
  const imagePages = chunkPairs(imageAttachments);
  const ceePagePreviews = ceeAttachments.flatMap((attachment) =>
    (attachment.ceePagePreviews || []).map((src, pageIndex) => ({
      attachment,
      src,
      pageIndex,
      totalPages: attachment.ceePagePreviews?.length || 0,
    }))
  );

  return (
  <Document>
    {/* Page 1: Executive Summary */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.brandHeader}>
          {data.logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
            <Image src={data.logoDataUri} style={styles.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
            <Text style={{ ...styles.text, marginTop: 5 }}>ID: {reportRef} | Fecha: {data.date}</Text>
            {data.isDemo && <Text style={{ ...styles.text, color: '#B96F00' }}>{t.demo}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.text}>{t.rating}</Text>
        <Text style={styles.letter}>{data.scoreResult.estimatedLetter}</Text>
        <Text style={styles.text}>{t.confidence}: {data.scoreResult.confidence} | Score: {data.scoreResult.score}/100</Text>
        <Text style={styles.text}>{t.zone}: {data.scoreResult.climateZone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.data}</Text>
        <View style={styles.row}><Text style={styles.colLeft}>{t.yearArea}</Text><Text style={styles.colRight}>{data.propertyData.year} / {data.propertyData.area} m²</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.zipcode}</Text><Text style={styles.colRight}>{data.propertyData.zipcode}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.orientation}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.orientation, language)} / {labelValue(data.propertyData.roofType, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.systems}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.heating, language)} / {labelValue(data.propertyData.cooling, language)} / {labelValue(data.propertyData.waterHeating, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.envelope}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.windows, language)} / {labelValue(data.propertyData.facadeInsulation, language)} / {labelValue(data.propertyData.roofInsulation, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>Renovables</Text><Text style={styles.colRight}>{labelValue(data.propertyData.renewables, language)}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.findings}</Text>
        <Text style={styles.text}>{data.scoreResult.explanation}</Text>
        
        {data.scoreResult.penalties.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ ...styles.text, fontWeight: 'bold', color: '#EF4444' }}>{t.penalties}</Text>
            {data.scoreResult.penalties.map((p, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </View>
        )}
        {data.scoreResult.strengths.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ ...styles.text, fontWeight: 'bold', color: '#008F5A' }}>{t.strengths}</Text>
            {data.scoreResult.strengths.map((s, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.disclaimer}>
        <Text>{getLegalDisclaimer(language)}</Text>
      </View>
    </Page>

    {/* Page 2: Scenarios */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <View style={styles.brandHeader}>
          {data.logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
            <Image src={data.logoDataUri} style={styles.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.scenarios}</Text>
            <Text style={styles.subtitle}>Rutas orientativas de mejora</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.scenarios}</Text>
        {data.scenarios.map((s, i) => (
          <View key={i} style={styles.scenarioBox}>
            <Text style={styles.scenarioTitle}>{s.title}</Text>
            <Text style={styles.text}>Objetivo: {s.objective}</Text>
            {s.description && <Text style={styles.text}>{s.description}</Text>}
            <Text style={styles.text}>Impacto esperado: {s.expectedLetterImpact}</Text>
            <Text style={styles.text}>Inversión: {s.estimatedCostRange} | Ahorro: {s.estimatedSavingsRange}</Text>
            {s.rationale && <Text style={styles.text}>Racional: {s.rationale}</Text>}
            <View style={{ marginTop: 5 }}>
              {s.measures.map((m, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{m}</Text>
                </View>
              ))}
            </View>
            {(s.disclaimers || []).map((disclaimer, j) => (
              <Text key={j} style={{ ...styles.text, color: '#856404', fontSize: 8 }}>{disclaimer}</Text>
            ))}
          </View>
        ))}
      </View>
    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <View style={styles.brandHeader}>
          {data.logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
            <Image src={data.logoDataUri} style={styles.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.regulation}</Text>
            <Text style={styles.subtitle}>{t.subsidies}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.regulation}</Text>
        {data.regulatoryContext.map((r, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{r.year} - {r.title} ({r.dateLabel})</Text>
            <Text style={styles.text}>{r.description}</Text>
            <Text style={styles.text}>Impacto para el usuario: {r.impactOnUser}</Text>
            <Text style={{ ...styles.text, fontSize: 8 }}>{r.legalReference}{r.disclaimer ? ` · ${r.disclaimer}` : ''}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.subsidies}</Text>
        {(data.subsidies || []).map((item) => (
          <View key={item.id} style={styles.scenarioBox}>
            <Text style={styles.scenarioTitle}>{item.title}</Text>
            <Text style={styles.text}>Ámbito: {item.scope} | Aplica a: {item.appliesTo.join(', ')}</Text>
            <Text style={styles.text}>{item.description}</Text>
            <Text style={{ ...styles.text, color: '#856404', fontSize: 8 }}>{item.eligibilityDisclaimer}</Text>
          </View>
        ))}
        <Text style={{ ...styles.text, color: '#856404', fontSize: 8 }}>
          EnergyScan no verifica convocatorias en tiempo real, no garantiza elegibilidad ni importes y recomienda consultar fuentes oficiales.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías de partners y proveedores</Text>
        <Text style={styles.text}>Categorías orientativas sugeridas para estudiar las mejoras: {data.providerCategories.join(', ')}.</Text>
        <Text style={styles.text}>Los proveedores o categorías sugeridas son orientativos. Cualquier presupuesto, visita técnica o actuación deberá ser confirmado directamente por profesionales cualificados. EnergyScan no sustituye al Certificado de Eficiencia Energética oficial.</Text>
      </View>

    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.brandHeader}>
          {data.logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
            <Image src={data.logoDataUri} style={styles.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.annexTitle}</Text>
            <Text style={styles.subtitle}>{t.userInfoAnnex}</Text>
            <Text style={{ ...styles.text, marginTop: 5 }}>ID: {reportRef} | Fecha: {data.date}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.userInfoAnnex}</Text>
        {buildUserDataRows(data, language).map(([label, value]) => (
          <View key={label} style={styles.annexRow}>
            <Text style={styles.colLeft}>{label}</Text>
            <Text style={styles.colRight}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.documentsAnnex}</Text>
        <Text style={styles.text}>{attachments.length > 0 ? formatDocumentsCount(attachments.length, language) : t.noDocuments}</Text>
        <Text style={styles.text}>Anexo - Documentación aportada por el usuario. Las evidencias mostradas forman parte de una demo y, en un caso real, serían documentación aportada por el usuario.</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text>Los documentos e imágenes mostrados en este anexo forman parte de una demo. En un caso real, serían documentación aportada por el usuario. EnergyScan no sustituye al Certificado de Eficiencia Energética oficial ni a la inspección de un técnico competente.</Text>
      </View>
    </Page>

    {ceeAttachments.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>CEE demo aportado</Text>
              <Text style={styles.subtitle}>Documento aportado por el usuario</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del documento</Text>
          {ceeAttachments.map((attachment) => (
            <View key={attachment.id} style={styles.annexMetaBox}>
              <View style={styles.row}><Text style={styles.colLeft}>{t.fileName}</Text><Text style={styles.colRight}>{attachment.name}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.fileType}</Text><Text style={styles.colRight}>{attachment.type}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.fileSize}</Text><Text style={styles.colRight}>{formatFileSize(attachment.size)}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>Letra recogida</Text><Text style={styles.colRight}>{attachment.ceeLetter || data.scoreResult.estimatedLetter}</Text></View>
              <Text style={{ ...styles.text, marginTop: 8 }}>{attachment.annexNote || 'Documento demo de ejemplo. Sin validez oficial ni administrativa.'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text>Documento demo de ejemplo. Sin validez oficial ni administrativa. EnergyScan no sustituye al Certificado de Eficiencia Energética oficial ni a la inspección de un técnico competente.</Text>
        </View>
      </Page>
    )}

    {ceePagePreviews.map(({ attachment, src, pageIndex, totalPages }) => (
      <Page key={`${attachment.id}-cee-page-${pageIndex}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>CEE demo aportado</Text>
              <Text style={styles.subtitle}>Página {pageIndex + 1} / {totalPages} del documento aportado</Text>
            </View>
          </View>
        </View>

        <View style={styles.ceePageFrame}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API. */}
          <Image src={src} style={styles.ceePageImage} />
        </View>
      </Page>
    ))}

    {imagePages.map((pageAttachments, index) => (
      <Page key={`image-page-${index}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>Anexo - Documentación aportada por el usuario</Text>
              <Text style={styles.subtitle}>Imágenes aportadas {index + 1} / {imagePages.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.imageAnnexGrid}>
          {pageAttachments.map((attachment) => (
            <View
              key={attachment.id}
              style={pageAttachments.length === 1 ? [styles.imageAnnexCard, styles.imageAnnexCardSingle] : styles.imageAnnexCard}
            >
              <Text style={styles.imageCaption}>{attachment.caption || attachment.name}</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API. */}
              <Image src={attachment.previewDataUri!} style={styles.annexImage} />
              <Text style={styles.imageMeta}>{attachment.category === 'EXTERIOR' ? 'Imagen exterior' : 'Imagen interior'} · {attachment.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text>Imágenes demo sin validez pericial. En un caso real, su interpretación exigiría revisión técnica presencial y documentación verificable.</Text>
        </View>
      </Page>
    ))}

    {otherAttachments.map((attachment, index) => (
      <Page key={attachment.id} size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{t.documentsAnnex}</Text>
              <Text style={styles.subtitle}>{t.documentPage} {index + 1} / {otherAttachments.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{attachment.caption || attachment.name}</Text>
          <View style={styles.annexMetaBox}>
            <View style={styles.row}><Text style={styles.colLeft}>{t.fileName}</Text><Text style={styles.colRight}>{attachment.name}</Text></View>
            <View style={styles.row}><Text style={styles.colLeft}>{t.fileType}</Text><Text style={styles.colRight}>{attachment.type || 'application/octet-stream'}</Text></View>
            <View style={styles.row}><Text style={styles.colLeft}>{t.fileSize}</Text><Text style={styles.colRight}>{formatFileSize(attachment.size)}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          {attachment.previewText ? (
            <View style={styles.documentFrame}>
              <Text style={styles.preText}>{attachment.previewText}</Text>
            </View>
          ) : (
            <View style={styles.documentFrame}>
              <Text style={styles.text}>{attachment.annexNote || t.previewUnavailable}</Text>
            </View>
          )}
        </View>
      </Page>
    ))}
  </Document>
  );
};
