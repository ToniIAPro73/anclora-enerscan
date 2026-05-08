import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { PremiumReportData } from '../domain/energy-assessment';
import { getLegalDisclaimer } from '../i18n';
import { formatFileSize } from '../attachments';

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

export const EnerScanReport = ({ data }: { data: PremiumReportData }) => {
  const language = data.language || 'es';
  const t = labels[language];

  return (
  <Document>
    {/* Page 1: Executive Summary */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
        <Text style={{ ...styles.text, marginTop: 5 }}>ID: {data.id} | Fecha: {data.date}</Text>
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
        <View style={styles.row}><Text style={styles.colLeft}>{t.orientation}</Text><Text style={styles.colRight}>{data.propertyData.orientation} / {data.propertyData.roofType}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.systems}</Text><Text style={styles.colRight}>{data.propertyData.heating} / {data.propertyData.cooling} / {data.propertyData.waterHeating}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>{t.envelope}</Text><Text style={styles.colRight}>{data.propertyData.windows} / {data.propertyData.facadeInsulation} / {data.propertyData.roofInsulation}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>Renovables</Text><Text style={styles.colRight}>{data.propertyData.renewables}</Text></View>
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
