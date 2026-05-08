import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { PremiumReportData } from '../domain/energy-assessment';
import { DISCLAIMER_TEXT } from '../regulatory';

export const EnerScanReport = ({ data }: { data: PremiumReportData }) => (
  <Document>
    {/* Page 1: Executive Summary */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>EnerScan Premium Report</Text>
        <Text style={styles.subtitle}>Prediagnóstico Energético Orientativo</Text>
        <Text style={{ ...styles.text, marginTop: 5 }}>ID: {data.id} | Fecha: {data.date}</Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.text}>Calificación Estimada</Text>
        <Text style={styles.letter}>{data.scoreResult.estimatedLetter}</Text>
        <Text style={styles.text}>Confianza: {data.scoreResult.confidence} | Score: {data.scoreResult.score}/100</Text>
        <Text style={styles.text}>Zona Climática: {data.scoreResult.climateZone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos Declarados</Text>
        <View style={styles.row}><Text style={styles.colLeft}>Año / Superficie</Text><Text style={styles.colRight}>{data.propertyData.year} / {data.propertyData.area} m²</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>Código Postal</Text><Text style={styles.colRight}>{data.propertyData.zipcode}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>Calefacción</Text><Text style={styles.colRight}>{data.propertyData.heating}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>Ventanas</Text><Text style={styles.colRight}>{data.propertyData.windows}</Text></View>
        <View style={styles.row}><Text style={styles.colLeft}>Renovables</Text><Text style={styles.colRight}>{data.propertyData.renewables}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen de Hallazgos</Text>
        <Text style={styles.text}>{data.scoreResult.explanation}</Text>
        
        {data.scoreResult.penalties.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ ...styles.text, fontWeight: 'bold', color: '#EF4444' }}>Penalizaciones principales:</Text>
            {data.scoreResult.penalties.map((p, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.disclaimer}>
        <Text>{DISCLAIMER_TEXT}</Text>
      </View>
    </Page>

    {/* Page 2: Scenarios & Regulatory */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Escenarios de Mejora</Text>
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
        <Text style={styles.sectionTitle}>Contexto Normativo</Text>
        {data.regulatoryContext.map((r, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text style={{ ...styles.text, fontWeight: 'bold' }}>{r.year} - {r.title} ({r.status})</Text>
            <Text style={styles.text}>{r.description}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
