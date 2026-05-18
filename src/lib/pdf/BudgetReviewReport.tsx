import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AppLanguage } from '@/lib/preferences';
import { getMonetizationCopy } from '@/lib/monetization/i18n';
import { buildBudgetAdvancedAnalysis } from '@/lib/budget-review/advanced-analysis';
import type { BudgetLineItem } from '@/lib/ingestion/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#F6F2EA' },
  header: { marginBottom: 20, borderBottom: '2 solid #008F5A', paddingBottom: 10 },
  brand: { fontSize: 10, color: '#008F5A', fontWeight: 'bold', marginBottom: 4 },
  title: { fontSize: 20, color: '#171512', fontWeight: 'bold' },
  subtitle: { fontSize: 11, color: '#645D53', marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, color: '#008F5A', fontWeight: 'bold', marginBottom: 8, borderBottom: '1 solid #D8CEC0', paddingBottom: 4 },
  text: { fontSize: 9, color: '#2B2721', lineHeight: 1.5, marginBottom: 3 },
  bold: { fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 3 },
  col40: { width: '40%', fontSize: 9, color: '#2B2721' },
  col20: { width: '20%', fontSize: 9, color: '#2B2721', textAlign: 'right' },
  colHeader: { fontWeight: 'bold', color: '#645D53', fontSize: 8 },
  tableHeader: { flexDirection: 'row', borderBottom: '1 solid #D8CEC0', paddingBottom: 3, marginBottom: 4 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  bulletDot: { width: 12, fontSize: 9, color: '#645D53' },
  bulletText: { flex: 1, fontSize: 9, color: '#2B2721' },
  statusGreen: { color: '#008F5A' },
  statusRed: { color: '#C0392B' },
  statusAmber: { color: '#B7791F' },
  disclaimer: { marginTop: 20, borderTop: '1 solid #D8CEC0', paddingTop: 8 },
  disclaimerText: { fontSize: 8, color: '#8B7D6B', lineHeight: 1.4 },
  metaRow: { flexDirection: 'row', gap: 24, marginBottom: 10 },
  metaItem: { fontSize: 9, color: '#645D53' },
  metaValue: { fontWeight: 'bold', color: '#2B2721' },
});

type StatusColor = 'statusGreen' | 'statusRed' | 'statusAmber';
const STATUS_COLOR: Record<string, StatusColor> = {
  IN_RANGE: 'statusGreen',
  HIGH_REVIEW: 'statusRed',
  LOW_REVIEW: 'statusAmber',
  INCOMPLETE: 'statusAmber',
  REQUIRES_CLARIFICATION: 'statusAmber',
};

export type BudgetReviewReportData = {
  id: string;
  date: string;
  fileName?: string;
  totalAmount?: number;
  currency: string;
  extractionConfidence?: number;
  lineItems: BudgetLineItem[];
  language: AppLanguage;
};

export function BudgetReviewReport({ data }: { data: BudgetReviewReportData }) {
  const t = getMonetizationCopy(data.language).budgetReview;
  const analysis = buildBudgetAdvancedAnalysis(data.lineItems, data.totalAmount, data.language);
  const confPct = data.extractionConfidence !== undefined ? `${Math.round(data.extractionConfidence * 100)}%` : '—';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{t.pdfBrand}</Text>
          <Text style={styles.title}>{t.pdfTitle}</Text>
          <Text style={styles.subtitle}>{t.pdfSubtitle}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaItem}>{t.pdfDate}</Text>
            <Text style={[styles.metaItem, styles.metaValue]}>{data.date}</Text>
          </View>
          {data.fileName && (
            <View>
              <Text style={styles.metaItem}>{data.fileName}</Text>
            </View>
          )}
          <View>
            <Text style={styles.metaItem}>{t.pdfItems}</Text>
            <Text style={[styles.metaItem, styles.metaValue]}>{data.lineItems.length}</Text>
          </View>
          {data.totalAmount !== undefined && (
            <View>
              <Text style={styles.metaItem}>{t.pdfTotal}</Text>
              <Text style={[styles.metaItem, styles.metaValue]}>{data.totalAmount.toLocaleString('es-ES', { maximumFractionDigits: 0 })} {data.currency}</Text>
            </View>
          )}
          <View>
            <Text style={styles.metaItem}>{t.pdfConfidence}</Text>
            <Text style={[styles.metaItem, styles.metaValue]}>{confPct}</Text>
          </View>
          <View>
            <Text style={styles.metaItem}>{t.pdfCategory}</Text>
            <Text style={[styles.metaItem, styles.metaValue]}>{analysis.category}</Text>
          </View>
        </View>

        {/* Semaphore table */}
        {analysis.findings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.pdfSemaphore}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col40, styles.colHeader]}>{t.pdfDescription}</Text>
              <Text style={[styles.col20, styles.colHeader]}>{t.pdfUnitPrice}</Text>
              <Text style={[styles.col20, styles.colHeader]}>{t.pdfTotal2}</Text>
              <Text style={[styles.col20, styles.colHeader]}>{t.pdfStatus}</Text>
            </View>
            {analysis.findings.slice(0, 15).map((f, i) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.col40, styles.text]}>{f.description || '—'}</Text>
                <Text style={[styles.col20, styles.text]}>{f.unitPrice !== undefined && f.unitPrice !== null ? `${f.unitPrice.toFixed(2)}` : '—'}</Text>
                <Text style={[styles.col20, styles.text]}>{f.total !== undefined && f.total !== null ? `${f.total.toFixed(2)}` : '—'}</Text>
                <Text style={[styles.col20, styles.text, styles[STATUS_COLOR[f.status] ?? 'statusAmber']]}>{t[`status${f.status}` as keyof typeof t] as string}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Omissions */}
        {analysis.omissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.pdfOmissions}</Text>
            {analysis.omissions.map((o, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{o.item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggested questions */}
        {analysis.suggestedQuestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.pdfQuestions}</Text>
            {analysis.suggestedQuestions.map((q, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>{i + 1}.</Text>
                <Text style={styles.bulletText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{t.pdfLegal}</Text>
        </View>
      </Page>
    </Document>
  );
}
