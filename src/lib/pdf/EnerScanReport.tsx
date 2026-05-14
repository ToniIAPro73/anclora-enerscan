import React from 'react';
import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { AssessmentAttachment, PremiumReportData } from '../domain/energy-assessment';
import { getLegalDisclaimer } from '../i18n';
import { formatFileSize } from '../attachments';
import { getPublicAssessmentRef } from '../stateless-assessment';
import { formatCostQuantity, formatEuroRange, formatUnitPrice } from '../costs/format';
import { COST_LEGAL_DISCLAIMER, FUTURE_PRICE_SOURCE_NOTE, PRICE_TRACEABILITY_NOTE } from '../costs/cost-disclaimers';
import { formatArea } from '../formatters';
import { getPreferencesForLanguage } from '../preferences';
import { localizeScenarios, localizeSubsidies } from '../scenario-i18n';

const labels = {
  es: {
    title: 'Informe Premium Anclora EnergyScan',
    subtitle: 'Prediagnóstico energético orientativo',
    demo: 'Informe demo con datos ficticios',
    rating: 'Calificación estimada',
    confidence: 'Confianza',
    zone: 'Zona Climática',
    data: 'Datos declarados',
    yearArea: 'Año / Superficie',
    zipcode: 'Código Postal',
    orientation: 'Orientación / Cubierta',
    systems: 'Sistemas',
    envelope: 'Envolvente',
    renewables: 'Renovables',
    findings: 'Resumen de hallazgos',
    penalties: 'Penalizaciones principales:',
    strengths: 'Fortalezas principales:',
    scenarios: 'Escenarios de mejora',
    regulation: 'Contexto normativo',
    subsidies: 'Ayudas y subvenciones potencialmente relevantes',
    attachments: 'Documentación aportada',
    attachmentsNote: 'Los archivos se registran como soporte documental, pero no han sido analizados automáticamente.',
    annexTitle: 'Anexo',
    userInfoAnnex: 'Información suministrada por el usuario',
    documentsAnnex: 'Documentos aportados',
    noDocuments: 'No se aportaron documentos adicionales.',
    documentsCount: 'Los PDF aportados se incorporan después de su resumen en su formato original.',
    documentPage: 'Documento aportado',
    fileName: 'Nombre',
    fileType: 'Tipo',
    fileSize: 'Tamaño',
    previewUnavailable: 'El contenido de este formato queda registrado como documento aportado, pero no se convierte automáticamente dentro del informe.',
    scenarioRouteSubtitle: 'Rutas orientativas de mejora',
    objective: 'Objetivo',
    expectedImpact: 'Impacto esperado',
    investment: 'Inversión',
    savings: 'Ahorro',
    jump: 'Salto estimado',
    indicativeRange: 'Rango orientativo',
    economicTitle: 'Estimación económica orientativa',
    economicSubtitle: 'Rangos por escenario y trazabilidad de fuentes',
    economicSummary: 'Resumen económico por escenario',
    economicDetail: 'Detalle de actuaciones estimadas',
    conservativeRecommendedPremium: 'Conservador / recomendado / premium',
    interventionLevel: 'Nivel de intervención',
    heatPumpTitle: 'Bomba de calor y aerotermia',
    technicalNote: 'Nota técnica',
    regulationSubtitle: 'Marco regulatorio aplicable',
    subsidiesSubtitle: 'Ayudas, cautelas y categorías profesionales',
    scope: 'Ámbito',
    appliesTo: 'Aplica a',
    providerCategoriesTitle: 'Categorías de partners y proveedores',
    ceeAnnexNote: 'Las páginas siguientes reproducen el PDF original aportado.',
    exterior: 'Imagen exterior',
    interior: 'Imagen interior',
    id: 'ID',
    date: 'Fecha',
    ceeSubmitted: 'CEE aportado',
    userDocument: 'Documento aportado por el usuario',
    documentSummary: 'Resumen del documento',
    collectedLetter: 'Letra recogida',
    ceeAnnexNoteShort: 'Documento PDF aportado por el usuario.',
    ceeDisclaimer: 'Documento aportado por el usuario. EnergyScan no sustituye al Certificado de Eficiencia Energética oficial ni a la inspección de un técnico competente.',
    cadastralReference: 'Referencia catastral',
    cadastralSource: 'Fuente catastral',
    cadastralVerified: 'Datos verificados mediante fuente oficial',
    dataSourcesTitle: 'Fuentes de datos y trazabilidad',
    ceeTitle: 'CEE importado',
    budgetTitle: 'Presupuesto analizado',
    source: 'Fuente',
    value: 'Valor',
    review: 'Revisión',
    budgetImpactDisclaimer: 'El impacto energético estimado de las reformas presupuestadas es orientativo. La mejora real dependerá de proyecto, ejecución, materiales, sistemas existentes y cálculo técnico oficial.',
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
    renewables: 'Renewables',
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
    scenarioRouteSubtitle: 'Indicative improvement routes',
    objective: 'Objective',
    expectedImpact: 'Expected impact',
    investment: 'Investment',
    savings: 'Savings',
    jump: 'Estimated jump',
    indicativeRange: 'Indicative range',
    economicTitle: 'Indicative economic estimate',
    economicSubtitle: 'Ranges by scenario and source traceability',
    economicSummary: 'Economic summary by scenario',
    economicDetail: 'Estimated action detail',
    conservativeRecommendedPremium: 'Conservative / recommended / premium',
    interventionLevel: 'Intervention level',
    heatPumpTitle: 'Heat pump and aerothermal systems',
    technicalNote: 'Technical note',
    regulationSubtitle: 'Applicable regulatory framework',
    subsidiesSubtitle: 'Grants, cautions and professional categories',
    scope: 'Scope',
    appliesTo: 'Applies to',
    providerCategoriesTitle: 'Partner and provider categories',
    ceeAnnexNote: 'The following pages reproduce the original PDF provided by the user.',
    exterior: 'Exterior image',
    interior: 'Interior image',
    id: 'ID',
    date: 'Date',
    ceeSubmitted: 'Submitted EPC',
    userDocument: 'Document provided by user',
    documentSummary: 'Document summary',
    collectedLetter: 'Collected rating',
    ceeAnnexNoteShort: 'PDF document provided by user.',
    ceeDisclaimer: 'Document provided by user. EnergyScan does not replace the official Energy Performance Certificate or an inspection by a qualified technician.',
    cadastralReference: 'Cadastral reference',
    cadastralSource: 'Cadastral source',
    cadastralVerified: 'Verified data from official source',
    dataSourcesTitle: 'Data sources and traceability',
    ceeTitle: 'Imported EPC',
    budgetTitle: 'Analysed quote',
    source: 'Source',
    value: 'Value',
    review: 'Review',
    budgetImpactDisclaimer: 'The estimated energy impact of quoted works is indicative. Real improvement depends on design, execution, materials, existing systems and official technical calculation.',
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
    renewables: 'Erneuerbare',
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
    scenarioRouteSubtitle: 'Orientierende Verbesserungsrouten',
    objective: 'Ziel',
    expectedImpact: 'Erwartete Wirkung',
    investment: 'Investition',
    savings: 'Einsparung',
    jump: 'Geschätzter Sprung',
    indicativeRange: 'Orientierungsrahmen',
    economicTitle: 'Orientierende Kostenschätzung',
    economicSubtitle: 'Spannen je Szenario und Nachvollziehbarkeit der Quellen',
    economicSummary: 'Kostenzusammenfassung je Szenario',
    economicDetail: 'Geschätzte Maßnahmen im Detail',
    conservativeRecommendedPremium: 'Konservativ / empfohlen / Premium',
    interventionLevel: 'Interventionsniveau',
    heatPumpTitle: 'Wärmepumpe und Aerothermie',
    technicalNote: 'Technische Notiz',
    regulationSubtitle: 'Anwendbarer regulatorischer Rahmen',
    subsidiesSubtitle: 'Förderungen, Hinweise und professionelle Kategorien',
    scope: 'Bereich',
    appliesTo: 'Gilt für',
    providerCategoriesTitle: 'Partner- und Anbieterkategorien',
    ceeAnnexNote: 'Die folgenden Seiten reproduzieren das vom Nutzer bereitgestellte Original-PDF.',
    exterior: 'Außenbild',
    interior: 'Innenbild',
    id: 'ID',
    date: 'Datum',
    ceeSubmitted: 'Eingereichter Energieausweis',
    userDocument: 'Vom Nutzer bereitgestelltes Dokument',
    documentSummary: 'Dokumentenzusammenfassung',
    collectedLetter: 'Erfasste Klasse',
    ceeAnnexNoteShort: 'Vom Nutzer bereitgestelltes PDF-Dokument.',
    ceeDisclaimer: 'Vom Nutzer bereitgestelltes Dokument. EnergyScan ersetzt keinen offiziellen Energieausweis oder eine Prüfung durch einen qualifizierten Techniker.',
    cadastralReference: 'Katasternummer',
    cadastralSource: 'Katasterquelle',
    cadastralVerified: 'Verifizierte Daten aus offizieller Quelle',
    dataSourcesTitle: 'Datenquellen und Nachvollziehbarkeit',
    ceeTitle: 'Importierter Energieausweis',
    budgetTitle: 'Analysiertes Angebot',
    source: 'Quelle',
    value: 'Wert',
    review: 'Prüfung',
    budgetImpactDisclaimer: 'Die geschätzte energetische Wirkung angebotener Arbeiten ist orientierend. Die tatsächliche Verbesserung hängt von Planung, Ausführung, Materialien, bestehenden Systemen und offizieller technischer Berechnung ab.',
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
  const measurementSystem = data.measurementSystem || getPreferencesForLanguage(language).measurementSystem;
  return [
    [fields.objective, labelValue(p.objective, language)],
    [fields.propertyType, labelPropertyType(p.propertyType, language)],
    [fields.year, String(p.year)],
    [fields.area, formatArea(p.area, measurementSystem, language)],
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

function costSourceSummary(language: 'es' | 'en' | 'de', sourceSummary?: string) {
  if (language === 'es') return sourceSummary || '';
  if (language === 'en') return 'Indicative cost range based on the internal demo price catalogue. Final prices require a professional quote.';
  return 'Orientierende Kostenspanne aus dem internen Demo-Preiskatalog. Endpreise erfordern ein professionelles Angebot.';
}

export const EnerScanReport = ({ data }: { data: PremiumReportData }) => {
  const language = data.language || 'es';
  const defaults = getPreferencesForLanguage(language);
  const currency = data.currency || defaults.currency;
  const measurementSystem = data.measurementSystem || defaults.measurementSystem;
  const t = labels[language];
  const reportRef = data.publicRef || getPublicAssessmentRef(data.id);
  const scenarios = localizeScenarios(data.scenarios, language);
  const subsidies = localizeSubsidies(data.subsidies || [], language);
  const attachments = data.attachments || [];
  const imageAttachments = attachments.filter((attachment) => attachment.previewDataUri);
  const isPdfAttachment = (attachment: AssessmentAttachment) => attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
  const isCeeAttachment = (attachment: AssessmentAttachment) => attachment.category === 'CEE' || isPdfAttachment(attachment);
  const ceeAttachments = attachments.filter(isCeeAttachment);
  const otherAttachments = attachments.filter((attachment) => !attachment.previewDataUri && !isCeeAttachment(attachment));
  const imagePages = chunkPairs(imageAttachments);

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
            <Text style={{ ...styles.text, marginTop: 5 }}>{t.id}: {reportRef} | {t.date}: {data.date}</Text>
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
        <View style={styles.row}><Text style={styles.colLeft}>{t.yearArea}</Text><Text style={styles.colRight}>{data.propertyData.year} / {formatArea(data.propertyData.area, measurementSystem, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.zipcode}</Text><Text style={styles.colRight}>{data.propertyData.zipcode}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.orientation}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.orientation, language)} / {labelValue(data.propertyData.roofType, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.systems}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.heating, language)} / {labelValue(data.propertyData.cooling, language)} / {labelValue(data.propertyData.waterHeating, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.envelope}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.windows, language)} / {labelValue(data.propertyData.facadeInsulation, language)} / {labelValue(data.propertyData.roofInsulation, language)}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.renewables}</Text><Text style={styles.colRight}>{labelValue(data.propertyData.renewables, language)}</Text></View>
        
        {data.cadastralRecord && (
          <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f0fff4', borderRadius: 4, border: '0.5pt solid #c6f6d5' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#22543d', marginBottom: 4 }}>✓ {t.cadastralVerified}</Text>
            <View style={styles.row}><Text style={{ ...styles.colLeft, fontSize: 8 }}>{t.cadastralReference}</Text><Text style={{ ...styles.colRight, fontSize: 8, fontWeight: 'bold' }}>{data.cadastralRecord.cadastralReference}</Text></View>
            <View style={styles.row}><Text style={{ ...styles.colLeft, fontSize: 8 }}>{t.cadastralSource}</Text><Text style={{ ...styles.colRight, fontSize: 8 }}>{data.cadastralRecord.source.toUpperCase()} ({data.date})</Text></View>
          </View>
        )}
      </View>

      {(data.energyCertificates?.length || data.rehabBudgets?.length || data.dataFieldSources?.length) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dataSourcesTitle}</Text>
          {(data.dataFieldSources || []).slice(0, 8).map((field, index) => (
            <View key={`${field.fieldName}-${index}`} style={styles.row}>
              <Text style={styles.colLeft}>{field.fieldName}</Text>
              <Text style={styles.colRight}>{String(field.value)} · {field.sourceLabel || field.sourceType} · {field.confidence ? `${Math.round(field.confidence * 100)}%` : t.review}</Text>
            </View>
          ))}
          {(data.energyCertificates || []).map((certificate, index) => (
            <View key={`certificate-${index}`} style={{ marginTop: 8, padding: 8, backgroundColor: '#f0fff4', borderRadius: 4 }}>
              <Text style={{ ...styles.text, fontWeight: 'bold', color: '#22543d' }}>{t.ceeTitle}</Text>
              <View style={styles.row}><Text style={styles.colLeft}>{t.collectedLetter}</Text><Text style={styles.colRight}>{certificate.globalLetter || '-'}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>EPnr</Text><Text style={styles.colRight}>{certificate.nonRenewableEPKwhM2Year ?? '-'} kWh/m²·año</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>CO2</Text><Text style={styles.colRight}>{certificate.emissionsKgCO2M2Year ?? '-'} kgCO₂/m²·año</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.yearArea}</Text><Text style={styles.colRight}>{certificate.yearBuilt || '-'} / {certificate.usefulAreaM2 || certificate.builtAreaM2 || '-'} m²</Text></View>
            </View>
          ))}
          {(data.rehabBudgets || []).map((budget, index) => (
            <View key={`budget-${index}`} style={{ marginTop: 8, padding: 8, backgroundColor: '#fff8e1', borderRadius: 4 }}>
              <Text style={{ ...styles.text, fontWeight: 'bold', color: '#856404' }}>{t.budgetTitle}</Text>
              <View style={styles.row}><Text style={styles.colLeft}>{t.investment}</Text><Text style={styles.colRight}>{budget.totalAmount ? `${budget.totalAmount.toLocaleString('es-ES')} ${budget.currency}` : '-'}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.jump}</Text><Text style={styles.colRight}>{budget.estimatedCurrentLetter || '-'} → {budget.estimatedPostBudgetLetter || '-'}</Text></View>
              <Text style={styles.text}>{budget.analysisSummary}</Text>
              <Text style={{ ...styles.text, color: '#856404', fontSize: 8 }}>{t.budgetImpactDisclaimer}</Text>
            </View>
          ))}
        </View>
      )}

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
            <Text style={styles.subtitle}>{t.scenarioRouteSubtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.scenarios}</Text>
        {scenarios.map((s, i) => (
          <View key={i} style={styles.scenarioBox} wrap={false}>
            <Text style={styles.scenarioTitle}>{s.title}</Text>
            <Text style={styles.text}>{t.objective}: {s.objective}</Text>
            {s.description && <Text style={styles.text}>{s.description}</Text>}
            <Text style={styles.text}>{t.expectedImpact}: {s.expectedLetterImpact}</Text>
            <Text style={styles.text}>{t.investment}: {s.estimatedCostRange} | {t.savings}: {s.estimatedSavingsRange}</Text>
            {s.costEstimate && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ ...styles.text, fontWeight: 'bold', color: '#008F5A' }}>
                  {t.indicativeRange}: {formatEuroRange(s.costEstimate.minTotal, s.costEstimate.maxTotal, s.costEstimate.midTotal, { currency, language })} · {t.confidence}: {s.costEstimate.confidence}
                </Text>
                <Text style={{ ...styles.text, fontSize: 8 }}>{costSourceSummary(language, s.costEstimate.sourceSummary)}</Text>
              </View>
            )}
            {s.rationale && <Text style={styles.text}>{s.rationale}</Text>}
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
            <Text style={styles.title}>{t.economicTitle}</Text>
            <Text style={styles.subtitle}>{t.economicSubtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.economicSummary}</Text>
        {scenarios.filter((scenario) => scenario.costEstimate).map((scenario) => (
          <View key={scenario.id} style={styles.scenarioBox} wrap={false}>
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>
            <Text style={styles.text}>{t.jump}: {scenario.expectedLetterImpact}</Text>
            <Text style={styles.text}>{t.interventionLevel}: {scenario.costEstimate?.interventionLevel || scenario.complexity || 'Orientativo'}</Text>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>
              {t.conservativeRecommendedPremium}: {formatEuroRange(scenario.costEstimate!.minTotal, scenario.costEstimate!.maxTotal, scenario.costEstimate!.midTotal, { currency, language })}
            </Text>
            <Text style={styles.text}>{t.confidence}: {scenario.costEstimate!.confidence}</Text>
            <Text style={{ ...styles.text, fontSize: 8 }}>{costSourceSummary(language, scenario.costEstimate!.sourceSummary)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.economicDetail}</Text>
        {scenarios.filter((scenario) => scenario.costEstimate).slice(0, 2).map((scenario) => (
          <View key={`${scenario.id}-cost-lines`} style={{ marginBottom: 8 }} wrap={false}>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{scenario.title}</Text>
            {scenario.costEstimate!.lines.slice(0, 5).map((line) => (
              <Text key={`${scenario.id}-${line.priceItemCode}`} style={{ ...styles.text, fontSize: 8 }}>
                {language === 'es' ? line.title : line.priceItemCode} · {formatCostQuantity(line.quantity, line.unit, { language, measurementSystem })} · {formatUnitPrice(line.minUnitPrice, line.unit, { currency, language, measurementSystem })} - {formatUnitPrice(line.maxUnitPrice, line.unit, { currency, language, measurementSystem })} · {formatEuroRange(line.minSubtotal, line.maxSubtotal, line.midSubtotal, { currency, language })} · {line.confidence}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Text>{PRICE_TRACEABILITY_NOTE}</Text>
        <Text>{FUTURE_PRICE_SOURCE_NOTE}</Text>
        <Text>{COST_LEGAL_DISCLAIMER}</Text>
      </View>
    </Page>

    {scenarios.some((scenario) => scenario.costEstimate?.heatPumpTechnicalNote) && (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{t.heatPumpTitle}</Text>
              <Text style={styles.subtitle}>{language === 'en' ? 'Technical dependencies and cautions' : language === 'de' ? 'Technische Abhängigkeiten und Hinweise' : 'Dependencias técnicas y cautelas'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.technicalNote}</Text>
          <Text style={styles.text}>{scenarios.find((scenario) => scenario.costEstimate?.heatPumpTechnicalNote)?.costEstimate?.heatPumpTechnicalNote}</Text>
          <Text style={styles.text}>{language === 'en' ? 'Before quoting, insulation, equipment space, emitters, electrical installation, acoustics, local rules and real consumption should be reviewed.' : language === 'de' ? 'Vor Angebotsabgabe sollten Dämmung, Platz für Geräte, Heizflächen, Elektroinstallation, Akustik, lokale Vorschriften und reale Verbräuche geprüft werden.' : 'Antes de presupuestar debe revisarse aislamiento, espacio para equipos, emisores, instalación eléctrica, acústica, normativa local y consumos reales.'}</Text>
        </View>
        <View style={styles.disclaimer}>
          <Text>{COST_LEGAL_DISCLAIMER}</Text>
        </View>
      </Page>
    )}

    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <View style={styles.brandHeader}>
          {data.logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
            <Image src={data.logoDataUri} style={styles.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.regulation}</Text>
            <Text style={styles.subtitle}>{t.regulationSubtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.regulation}</Text>
        {data.regulatoryContext.map((r, i) => (
          <View key={i} style={{ marginBottom: 10 }} wrap={false}>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{r.year} - {r.title} ({r.dateLabel})</Text>
            <Text style={styles.text}>{r.description}</Text>
            <Text style={styles.text}>{language === 'en' ? 'User impact' : language === 'de' ? 'Auswirkung für Nutzer' : 'Impacto para el usuario'}: {language === 'es' ? r.impactOnUser : getLegalDisclaimer(language)}</Text>
            <Text style={{ ...styles.text, fontSize: 8 }}>{r.legalReference}{r.disclaimer ? ` · ${r.disclaimer}` : ''}</Text>
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
            <Text style={styles.title}>{t.subsidies}</Text>
            <Text style={styles.subtitle}>{t.subsidiesSubtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.subsidies}</Text>
        {subsidies.map((item) => (
          <View key={item.id} style={styles.scenarioBox} wrap={false}>
            <Text style={styles.scenarioTitle}>{item.title}</Text>
            <Text style={styles.text}>{t.scope}: {item.scope} | {t.appliesTo}: {item.appliesTo.join(', ')}</Text>
            <Text style={styles.text}>{item.description}</Text>
            <Text style={{ ...styles.text, color: '#856404', fontSize: 8 }}>{item.eligibilityDisclaimer}</Text>
          </View>
        ))}
        <Text style={{ ...styles.text, color: '#856404', fontSize: 8 }}>
          {language === 'en' ? 'EnergyScan does not verify calls in real time, does not guarantee eligibility or amounts, and recommends checking official sources.' : language === 'de' ? 'EnergyScan prüft Ausschreibungen nicht in Echtzeit, garantiert weder Förderfähigkeit noch Beträge und empfiehlt die Prüfung offizieller Quellen.' : 'EnergyScan no verifica convocatorias en tiempo real, no garantiza elegibilidad ni importes y recomienda consultar fuentes oficiales.'}
        </Text>
      </View>

      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>{t.providerCategoriesTitle}</Text>
        <Text style={styles.text}>{language === 'en' ? 'Indicative categories suggested to study the improvements' : language === 'de' ? 'Orientierende Kategorien zur Prüfung der Maßnahmen' : 'Categorías orientativas sugeridas para estudiar las mejoras'}: {data.providerCategories.join(', ')}.</Text>
        <Text style={styles.text}>{getLegalDisclaimer(language)}</Text>
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
            <Text style={{ ...styles.text, marginTop: 5 }}>{t.id}: {reportRef} | {t.date}: {data.date}</Text>
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
        <Text style={styles.text}>{language === 'en' ? 'Appendix - Submitted documentation. The evidence shown is part of a demo and, in a real case, would be documentation supplied by the user.' : language === 'de' ? 'Anhang - Eingereichte Dokumentation. Die gezeigten Nachweise sind Teil einer Demo und wären in einem realen Fall vom Nutzer bereitgestellte Dokumentation.' : 'Anexo - Documentación aportada por el usuario. Las evidencias mostradas forman parte de una demo y, en un caso real, serían documentación aportada por el usuario.'}</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text>{getLegalDisclaimer(language)}</Text>
      </View>
    </Page>

    {imagePages.map((pageAttachments, index) => (
      <Page key={`image-page-${index}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{t.annexTitle} - {t.documentsAnnex}</Text>
              <Text style={styles.subtitle}>{language === 'en' ? 'Submitted images' : language === 'de' ? 'Eingereichte Bilder' : 'Imágenes aportadas'} {index + 1} / {imagePages.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.imageAnnexGrid}>
          {pageAttachments.map((attachment) => (
            <View
              key={attachment.id}
              style={pageAttachments.length === 1 ? [styles.imageAnnexCard, styles.imageAnnexCardSingle] : styles.imageAnnexCard}
              wrap={false}
            >
              <Text style={styles.imageCaption}>{attachment.caption || attachment.name}</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API. */}
              <Image src={attachment.previewDataUri!} style={styles.annexImage} />
              <Text style={styles.imageMeta}>{attachment.category === 'EXTERIOR' ? t.exterior : t.interior} · {attachment.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text>{language === 'en' ? 'Demo images with no expert validity. In a real case, interpretation would require on-site technical review and verifiable documentation.' : language === 'de' ? 'Demobilder ohne Gutachtenwert. In einem realen Fall erfordert die Interpretation eine technische Vor-Ort-Prüfung und prüfbare Dokumentation.' : 'Imágenes demo sin validez pericial. En un caso real, su interpretación exigiría revisión técnica presencial y documentación verificable.'}</Text>
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
          <View style={styles.annexMetaBox} wrap={false}>
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

    {ceeAttachments.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandHeader}>
            {data.logoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not expose an alt prop in its typed API.
              <Image src={data.logoDataUri} style={styles.logo} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{t.ceeSubmitted}</Text>
              <Text style={styles.subtitle}>{t.userDocument}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.documentSummary}</Text>
          {ceeAttachments.map((attachment) => (
            <View key={attachment.id} style={styles.annexMetaBox} wrap={false}>
              <View style={styles.row}><Text style={styles.colLeft}>{t.fileName}</Text><Text style={styles.colRight}>{attachment.name}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.fileType}</Text><Text style={styles.colRight}>{attachment.type}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.fileSize}</Text><Text style={styles.colRight}>{formatFileSize(attachment.size)}</Text></View>
              <View style={styles.row}><Text style={styles.colLeft}>{t.collectedLetter}</Text><Text style={styles.colRight}>{attachment.ceeLetter || data.scoreResult.estimatedLetter}</Text></View>
              <Text style={{ ...styles.text, marginTop: 8 }}>{attachment.annexNote || t.ceeAnnexNoteShort}</Text>
              <Text style={{ ...styles.text, color: '#008F5A', fontWeight: 'bold', marginTop: 6 }}>
                {t.ceeAnnexNote} CEE en español, con importes en euros y superficies en m².
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text>{t.ceeDisclaimer}</Text>
        </View>
      </Page>
    )}
  </Document>
  );
};
