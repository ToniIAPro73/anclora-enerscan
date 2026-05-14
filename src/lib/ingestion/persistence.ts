import type { Prisma } from '@prisma/client';
import type { EnergyCertificateCEE, ExtractedField, RehabBudgetAnalysis } from './types';

function optionalDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function certificateToPrismaCreate(input: {
  assessmentId: string;
  attachmentId?: string;
  certificate: EnergyCertificateCEE;
}): Prisma.EnergyCertificateCreateInput {
  const certificate = input.certificate;
  return {
    assessment: { connect: { id: input.assessmentId } },
    attachment: input.attachmentId ? { connect: { id: input.attachmentId } } : undefined,
    sourceProgram: certificate.sourceProgram,
    sourceFormat: certificate.sourceFormat,
    extractionStatus: certificate.extractionStatus,
    extractionConfidence: certificate.extractionConfidence,
    issueDate: optionalDate(certificate.issueDate),
    validUntil: optionalDate(certificate.validUntil),
    addressLine: certificate.addressLine,
    cadastralReference: certificate.cadastralReference,
    postalCode: certificate.postalCode,
    municipality: certificate.municipality,
    province: certificate.province,
    useType: certificate.useType,
    climateZone: certificate.climateZone,
    yearBuilt: certificate.yearBuilt,
    usefulAreaM2: certificate.usefulAreaM2,
    builtAreaM2: certificate.builtAreaM2,
    globalLetter: certificate.globalLetter,
    nonRenewableEPKwhM2Year: certificate.nonRenewableEPKwhM2Year,
    emissionsKgCO2M2Year: certificate.emissionsKgCO2M2Year,
    heatingDemandKwhM2Year: certificate.heatingDemandKwhM2Year,
    coolingDemandKwhM2Year: certificate.coolingDemandKwhM2Year,
    acsDemandKwhM2Year: certificate.acsDemandKwhM2Year,
    recommendationsJson: certificate.recommendations as Prisma.InputJsonValue,
    extractedFieldsJson: certificate.extractedFields as Prisma.InputJsonValue,
    rawTextHash: certificate.rawTextHash,
    rawXmlStored: certificate.rawXmlStored || false,
  };
}

export function budgetToPrismaCreate(input: {
  assessmentId: string;
  attachmentId?: string;
  budget: RehabBudgetAnalysis;
  sourceFormat?: string;
}): Prisma.RehabBudgetCreateInput {
  const budget = input.budget;
  return {
    assessment: { connect: { id: input.assessmentId } },
    attachment: input.attachmentId ? { connect: { id: input.attachmentId } } : undefined,
    sourceFormat: input.sourceFormat || 'PDF_TEXT',
    extractionStatus: budget.extractionStatus,
    extractionConfidence: budget.extractionConfidence,
    providerName: budget.providerName,
    budgetDate: optionalDate(budget.budgetDate),
    totalAmount: budget.totalAmount,
    currency: budget.currency,
    vatIncluded: budget.vatIncluded,
    detectedCategoriesJson: budget.detectedMeasures.map((measure) => measure.category) as Prisma.InputJsonValue,
    detectedMeasuresJson: budget.detectedMeasures as Prisma.InputJsonValue,
    lineItemsJson: budget.lineItems as Prisma.InputJsonValue,
    estimatedCurrentLetter: budget.estimatedCurrentLetter,
    estimatedPostBudgetLetter: budget.estimatedPostBudgetLetter,
    targetLetter: budget.targetLetter,
    targetReached: budget.targetReached,
    impactConfidence: budget.impactConfidence,
    missingMeasuresJson: budget.missingMeasures as Prisma.InputJsonValue,
    analysisSummary: budget.analysisSummary,
  };
}

export function fieldsToPrismaCreateMany(assessmentId: string, sourceId: string | undefined, fields: ExtractedField[]) {
  return fields.map((field) => ({
    assessmentId,
    fieldName: field.fieldName,
    valueJson: field.value as Prisma.InputJsonValue,
    sourceType: field.sourceType,
    sourceId,
    confidence: field.confidence,
    requiresReview: Boolean(field.requiresReview),
    appliedToWizard: Boolean(field.appliedToWizard),
  }));
}

export function prismaCertificateToDto(record: {
  sourceProgram: string | null;
  sourceFormat: string;
  extractionStatus: string;
  extractionConfidence: number | null;
  issueDate: Date | null;
  validUntil: Date | null;
  addressLine: string | null;
  cadastralReference: string | null;
  postalCode: string | null;
  municipality: string | null;
  province: string | null;
  useType: string | null;
  climateZone: string | null;
  yearBuilt: number | null;
  usefulAreaM2: number | null;
  builtAreaM2: number | null;
  globalLetter: string | null;
  nonRenewableEPKwhM2Year: number | null;
  emissionsKgCO2M2Year: number | null;
  heatingDemandKwhM2Year: number | null;
  coolingDemandKwhM2Year: number | null;
  acsDemandKwhM2Year: number | null;
  recommendationsJson: Prisma.JsonValue | null;
  extractedFieldsJson: Prisma.JsonValue | null;
  rawTextHash: string | null;
  rawXmlStored: boolean;
}): EnergyCertificateCEE {
  return {
    sourceProgram: (record.sourceProgram || 'UNKNOWN') as EnergyCertificateCEE['sourceProgram'],
    sourceFormat: record.sourceFormat as EnergyCertificateCEE['sourceFormat'],
    extractionStatus: record.extractionStatus as EnergyCertificateCEE['extractionStatus'],
    extractionConfidence: record.extractionConfidence || undefined,
    issueDate: record.issueDate?.toISOString(),
    validUntil: record.validUntil?.toISOString(),
    addressLine: record.addressLine || undefined,
    cadastralReference: record.cadastralReference || undefined,
    postalCode: record.postalCode || undefined,
    municipality: record.municipality || undefined,
    province: record.province || undefined,
    useType: record.useType || undefined,
    climateZone: record.climateZone || undefined,
    yearBuilt: record.yearBuilt || undefined,
    usefulAreaM2: record.usefulAreaM2 || undefined,
    builtAreaM2: record.builtAreaM2 || undefined,
    globalLetter: record.globalLetter as EnergyCertificateCEE['globalLetter'],
    nonRenewableEPKwhM2Year: record.nonRenewableEPKwhM2Year || undefined,
    emissionsKgCO2M2Year: record.emissionsKgCO2M2Year || undefined,
    heatingDemandKwhM2Year: record.heatingDemandKwhM2Year || undefined,
    coolingDemandKwhM2Year: record.coolingDemandKwhM2Year || undefined,
    acsDemandKwhM2Year: record.acsDemandKwhM2Year || undefined,
    recommendations: Array.isArray(record.recommendationsJson) ? record.recommendationsJson as EnergyCertificateCEE['recommendations'] : undefined,
    extractedFields: Array.isArray(record.extractedFieldsJson) ? record.extractedFieldsJson as ExtractedField[] : undefined,
    rawTextHash: record.rawTextHash || undefined,
    rawXmlStored: record.rawXmlStored,
  };
}
