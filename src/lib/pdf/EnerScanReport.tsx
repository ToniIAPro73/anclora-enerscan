import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { PremiumReportData } from '../domain/energy-assessment';
import { getLegalDisclaimer } from '../i18n';
import { formatFileSize } from '../attachments';
import { getPublicAssessmentRef } from '../stateless-assessment';

const labels = {
  es: {
    title: 'EnerScan Premium Report',
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
    attachments: 'Documentación aportada',
    attachmentsNote: 'Los archivos se registran como soporte documental, pero no han sido analizados automáticamente.',
  },
  en: {
    title: 'EnerScan Premium Report',
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
    attachments: 'Submitted documentation',
    attachmentsNote: 'Files are registered as supporting documentation, but have not been automatically analyzed.',
  },
  de: {
    title: 'EnerScan Premium Report',
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
    attachments: 'Eingereichte Dokumentation',
    attachmentsNote: 'Dateien werden als Nachweis erfasst, aber nicht automatisch analysiert.',
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
    unknown: 'Nicht angegeben',
  },
};

function labelValue(value: string | undefined, language: 'es' | 'en' | 'de') {
  if (!value) return valueLabels[language].unknown;
  const key = value === 'flat' ? 'flat_roof' : value;
  return valueLabels[language][key] || value;
}

export const EnerScanReport = ({ data }: { data: PremiumReportData }) => {
  const language = data.language || 'es';
  const t = labels[language];
  const reportRef = getPublicAssessmentRef(data.id);

  return (
  <Document>
    {/* Page 1: Executive Summary */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
        <Text style={{ ...styles.text, marginTop: 5 }}>ID: {reportRef} | Fecha: {data.date}</Text>
        {data.isDemo && <Text style={{ ...styles.text, color: '#B96F00' }}>{t.demo}</Text>}
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

    {/* Page 2: Scenarios & Regulatory */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.scenarios}</Text>
        {data.scenarios.map((s, i) => (
          <View key={i} style={styles.scenarioBox}>
            <Text style={styles.scenarioTitle}>{s.title}</Text>
            <Text style={styles.text}>Objetivo: {s.objective}</Text>
            <Text style={styles.text}>Impacto esperado: {s.expectedLetterImpact}</Text>
            <Text style={styles.text}>Coste: {s.estimatedCostRange} | Ahorro: {s.estimatedSavingsRange}</Text>
            <View style={{ marginTop: 5 }}>
              {s.measures.map((m, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.regulation}</Text>
        {data.regulatoryContext.map((r, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{r.year} - {r.title} ({r.status})</Text>
            <Text style={styles.text}>{r.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.attachments}</Text>
        <Text style={styles.text}>{t.attachmentsNote}</Text>
        {(data.attachments || []).length > 0 ? (data.attachments || []).map((attachment) => (
          <View key={attachment.id} style={styles.row}>
            <Text style={styles.colLeft}>{attachment.name}</Text>
            <Text style={styles.colRight}>{attachment.type} · {formatFileSize(attachment.size)}</Text>
          </View>
        )) : <Text style={styles.text}>Sin documentación adicional.</Text>}
      </View>
    </Page>
  </Document>
  );
};
