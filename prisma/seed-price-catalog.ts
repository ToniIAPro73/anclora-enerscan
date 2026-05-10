import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { energyMeasures, measurePriceMaps, priceItems, priceSources } from '../src/lib/costs/seed-data';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith('postgres')) {
  throw new Error('Set DATABASE_URL to a Neon/PostgreSQL connection string before seeding the price catalog.');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const sourceByName = new Map<string, string>();
  for (const source of priceSources) {
    const record = await prisma.priceSource.upsert({
      where: { id: source.name },
      update: {
        providerType: source.providerType,
        sourceKind: source.sourceKind,
        versionLabel: source.versionLabel,
        region: source.region,
        url: source.url,
        licenseNote: source.licenseNote,
        reliability: source.reliability,
        capturedAt: source.capturedAt ? new Date(source.capturedAt) : undefined,
        validFrom: source.validFrom ? new Date(source.validFrom) : undefined,
        validTo: source.validTo ? new Date(source.validTo) : undefined,
        notes: source.notes,
      },
      create: {
        id: source.name,
        ...source,
        capturedAt: source.capturedAt ? new Date(source.capturedAt) : undefined,
        validFrom: source.validFrom ? new Date(source.validFrom) : undefined,
        validTo: source.validTo ? new Date(source.validTo) : undefined,
      },
    });
    sourceByName.set(source.name, record.id);
  }

  const itemByCode = new Map<string, string>();
  for (const item of priceItems) {
    const sourceId = sourceByName.get(item.sourceName);
    if (!sourceId) throw new Error(`Missing price source ${item.sourceName}`);
    const record = await prisma.priceItem.upsert({
      where: { guid: item.guid },
      update: {
        sourceId,
        code: item.code,
        externalCode: item.externalCode,
        title: item.title,
        description: item.description,
        unit: item.unit,
        minUnitPrice: item.minUnitPrice,
        midUnitPrice: item.midUnitPrice,
        maxUnitPrice: item.maxUnitPrice,
        currency: item.currency || 'EUR',
        region: item.region,
        category: item.category,
        applicableTo: JSON.stringify(item.applicableTo),
        tags: JSON.stringify(item.tags),
        confidence: item.confidence,
        isActive: true,
      },
      create: {
        guid: item.guid,
        sourceId,
        code: item.code,
        externalCode: item.externalCode,
        title: item.title,
        description: item.description,
        unit: item.unit,
        minUnitPrice: item.minUnitPrice,
        midUnitPrice: item.midUnitPrice,
        maxUnitPrice: item.maxUnitPrice,
        currency: item.currency || 'EUR',
        region: item.region,
        category: item.category,
        applicableTo: JSON.stringify(item.applicableTo),
        tags: JSON.stringify(item.tags),
        confidence: item.confidence,
      },
    });
    itemByCode.set(item.code, record.id);
  }

  const measureByCode = new Map<string, string>();
  for (const measure of energyMeasures) {
    const record = await prisma.energyMeasure.upsert({
      where: { code: measure.code },
      update: measure,
      create: measure,
    });
    measureByCode.set(measure.code, record.id);
  }

  for (const mapping of measurePriceMaps) {
    const measureId = measureByCode.get(mapping.measureCode);
    const priceItemId = itemByCode.get(mapping.priceItemCode);
    if (!measureId || !priceItemId) throw new Error(`Invalid mapping ${mapping.measureCode} -> ${mapping.priceItemCode}`);
    const existing = await prisma.measurePriceMap.findFirst({ where: { measureId, priceItemId, quantityFormula: mapping.quantityFormula } });
    const data = {
      measureId,
      priceItemId,
      quantityFormula: mapping.quantityFormula,
      defaultFactor: mapping.defaultFactor || 1,
      minFactor: mapping.minFactor,
      maxFactor: mapping.maxFactor,
      notes: mapping.notes,
    };
    if (existing) await prisma.measurePriceMap.update({ where: { id: existing.id }, data });
    else await prisma.measurePriceMap.create({ data });
  }

  console.info(`Seeded ${priceSources.length} price sources, ${priceItems.length} price items, ${energyMeasures.length} energy measures and ${measurePriceMaps.length} mappings.`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
