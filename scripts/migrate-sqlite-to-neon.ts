import { createClient } from '@libsql/client';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';

type Row = Record<string, unknown>;

const sourceUrl = process.env.SQLITE_DATABASE_URL || 'file:./dev.db';
const targetUrl = process.env.DATABASE_URL;

if (!targetUrl?.startsWith('postgres')) {
  throw new Error('Set DATABASE_URL to the target Neon Postgres connection string before running this migration.');
}

const sqlite = createClient({ url: sourceUrl });
const pool = new Pool({ connectionString: targetUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function asDate(value: unknown) {
  return value ? new Date(String(value)) : undefined;
}

function asString(value: unknown) {
  return value === null || value === undefined ? undefined : String(value);
}

function asNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function asBoolean(value: unknown) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

async function tableRows(table: string): Promise<Row[]> {
  try {
    const result = await sqlite.execute(`SELECT * FROM "${table}"`);
    return result.rows.map((row) => ({ ...row }));
  } catch (error) {
    console.warn(`Skipping ${table}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function migrateAttachmentPath(row: Row) {
  const storedPath = asString(row.path);
  if (!storedPath || storedPath.startsWith('blob:') || storedPath.startsWith('demo-assets/')) return storedPath || '';
  if (!process.env.BLOB_READ_WRITE_TOKEN) return storedPath;

  try {
    const bytes = await readFile(storedPath);
    const assessmentId = asString(row.assessmentId) || 'unassigned';
    const filename = path.basename(storedPath);
    const pathname = `assessments/${assessmentId}/${filename}`;
    await put(pathname, bytes, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: asString(row.type) || 'application/octet-stream',
      multipart: bytes.length > 4.5 * 1024 * 1024,
    });
    return `blob:${pathname}`;
  } catch (error) {
    console.warn(`Keeping local attachment path ${storedPath}: ${error instanceof Error ? error.message : String(error)}`);
    return storedPath;
  }
}

async function main() {
  const assessments = await tableRows('Assessment');
  for (const row of assessments) {
    const id = asString(row.id);
    if (!id) continue;
    await prisma.assessment.upsert({
      where: { id },
      update: {},
      create: {
        id,
        createdAt: asDate(row.createdAt),
        updatedAt: asDate(row.updatedAt),
        objective: asString(row.objective),
        propertyType: asString(row.propertyType),
        orientation: asString(row.orientation),
        roofType: asString(row.roofType),
        year: asNumber(row.year) || 2000,
        area: asNumber(row.area) || 1,
        zipcode: asString(row.zipcode) || '00000',
        heating: asString(row.heating),
        cooling: asString(row.cooling),
        waterHeating: asString(row.waterHeating),
        ventilation: asString(row.ventilation),
        windows: asString(row.windows),
        renewables: asString(row.renewables),
        facadeInsulation: asString(row.facadeInsulation),
        roofInsulation: asString(row.roofInsulation),
        budgetRange: asString(row.budgetRange),
        timelineHorizon: asString(row.timelineHorizon),
        targetLetter: asString(row.targetLetter),
        isDemo: asBoolean(row.isDemo) || false,
        score: asNumber(row.score),
        estimatedLetter: asString(row.estimatedLetter) || 'E',
        confidence: asString(row.confidence) || 'Media',
        climateZone: asString(row.climateZone),
        penalties: asString(row.penalties),
        strengths: asString(row.strengths),
        missingData: asString(row.missingData),
        explanation: asString(row.explanation),
        isPremium: asBoolean(row.isPremium) || false,
      },
    });
  }

  const partners = await tableRows('Partner');
  for (const row of partners) {
    const id = asString(row.id);
    if (!id) continue;
    await prisma.partner.upsert({
      where: { id },
      update: {},
      create: {
        id,
        createdAt: asDate(row.createdAt),
        updatedAt: asDate(row.updatedAt),
        name: asString(row.name) || 'Partner demo',
        type: asString(row.type) || 'REAL_ESTATE',
        company: asString(row.company),
        email: asString(row.email),
        phone: asString(row.phone),
        website: asString(row.website),
        status: asString(row.status) || 'ACTIVE',
        attributionMonths: asNumber(row.attributionMonths) || 12,
        defaultCommissionRate: asNumber(row.defaultCommissionRate),
        notes: asString(row.notes),
      },
    });
  }

  const providers = await tableRows('Provider');
  for (const row of providers) {
    const id = asString(row.id);
    if (!id) continue;
    await prisma.provider.upsert({
      where: { id },
      update: {},
      create: {
        id,
        createdAt: asDate(row.createdAt),
        updatedAt: asDate(row.updatedAt),
        name: asString(row.name) || 'Provider demo',
        legalName: asString(row.legalName),
        taxId: asString(row.taxId),
        contactName: asString(row.contactName),
        email: asString(row.email),
        phone: asString(row.phone),
        website: asString(row.website),
        categories: asString(row.categories) || '[]',
        zones: asString(row.zones) || '[]',
        certifications: asString(row.certifications),
        status: asString(row.status) || 'PENDING',
        verified: asBoolean(row.verified) || false,
        rating: asNumber(row.rating) || 4.5,
        slaHours: asNumber(row.slaHours),
        commissionType: asString(row.commissionType),
        commissionRate: asNumber(row.commissionRate),
        leadFeeCents: asNumber(row.leadFeeCents),
        monthlyFeeCents: asNumber(row.monthlyFeeCents),
        attributionMonths: asNumber(row.attributionMonths) || 12,
        notes: asString(row.notes),
        source: asString(row.source),
        partnerId: asString(row.partnerId),
      },
    });
  }

  const attachments = await tableRows('AssessmentAttachment');
  for (const row of attachments) {
    const id = asString(row.id);
    if (!id) continue;
    await prisma.assessmentAttachment.upsert({
      where: { id },
      update: {},
      create: {
        id,
        assessmentId: asString(row.assessmentId) || '',
        name: asString(row.name) || 'attachment',
        type: asString(row.type) || 'application/octet-stream',
        size: asNumber(row.size) || 0,
        path: await migrateAttachmentPath(row),
        createdAt: asDate(row.createdAt),
      },
    });
  }

  const leads = await tableRows('Lead');
  for (const row of leads) {
    const id = asString(row.id);
    if (!id) continue;
    await prisma.lead.upsert({
      where: { id },
      update: {},
      create: {
        id,
        createdAt: asDate(row.createdAt),
        updatedAt: asDate(row.updatedAt),
        assessmentId: asString(row.assessmentId),
        providerId: asString(row.providerId),
        partnerId: asString(row.partnerId),
        userName: asString(row.userName),
        userEmail: asString(row.userEmail),
        userPhone: asString(row.userPhone),
        requestedService: asString(row.requestedService),
        estimatedBudget: asString(row.estimatedBudget),
        urgency: asString(row.urgency),
        zone: asString(row.zone),
        source: asString(row.source),
        attributionOwner: asString(row.attributionOwner),
        attributionExpiresAt: asDate(row.attributionExpiresAt),
        status: asString(row.status) || 'PENDING',
        commissionStatus: asString(row.commissionStatus) || 'NOT_APPLICABLE',
        expectedValueCents: asNumber(row.expectedValueCents),
        closedValueCents: asNumber(row.closedValueCents),
        commissionCents: asNumber(row.commissionCents),
        consentAccepted: asBoolean(row.consentAccepted) || false,
        notes: asString(row.notes),
      },
    });
  }

  console.info(`Migrated ${assessments.length} assessments, ${attachments.length} attachments, ${partners.length} partners, ${providers.length} providers and ${leads.length} leads to Neon.`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await sqlite.close();
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
