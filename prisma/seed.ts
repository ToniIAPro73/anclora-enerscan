import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
if (!databaseUrl.startsWith('postgres')) {
  throw new Error('Seed now targets Neon/PostgreSQL. Set DATABASE_URL to a Postgres connection string before running it.')
}

const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: databaseUrl })) })

async function main() {
  console.log('Seeding partners and providers...')
  
  await prisma.lead.deleteMany({})
  await prisma.provider.deleteMany({})
  await prisma.partner.deleteMany({})

  const realEstatePartner = await prisma.partner.create({
    data: {
      name: 'Partner Real Estate Mallorca',
      type: 'REAL_ESTATE',
      company: 'Demo Real Estate Agency',
      email: 'realestate.partner.demo@anclora.local',
      defaultCommissionRate: 25,
      attributionMonths: 12,
      status: 'ACTIVE',
      notes: 'Partner comercial demo para atribución inmobiliaria.',
    },
  })

  const technicalPartner = await prisma.partner.create({
    data: {
      name: 'Partner Técnico Demo',
      type: 'PROVIDER_REFERRER',
      company: 'Demo Technical Network',
      email: 'technical.partner.demo@anclora.local',
      defaultCommissionRate: 25,
      attributionMonths: 12,
      status: 'ACTIVE',
      notes: 'Partner técnico demo para captación de proveedores.',
    },
  })

  await prisma.provider.createMany({
    data: [
      {
        name: 'Demo Certificación Energética Mediterráneo',
        legalName: 'Demo Certificación Energética Mediterráneo S.L.',
        contactName: 'Técnico Demo CEE',
        email: 'certificacion.demo@anclora.local',
        categories: JSON.stringify(['CEE', 'AUDIT']),
        zones: JSON.stringify(['Mallorca', 'Illes Balears', 'Valencia']),
        certifications: JSON.stringify(['Técnico competente demo', 'Registro demo CEE']),
        status: 'PREFERRED',
        verified: true,
        rating: 4.8,
        slaHours: 24,
        commissionType: 'LEAD_FEE',
        leadFeeCents: 1800,
        commissionRate: 8,
        attributionMonths: 12,
        source: 'internal',
        partnerId: technicalPartner.id,
      },
      {
        name: 'Demo Ventanas Eficientes Levante',
        legalName: 'Demo Ventanas Eficientes Levante S.L.',
        contactName: 'Responsable Demo Ventanas',
        email: 'ventanas.demo@anclora.local',
        categories: JSON.stringify(['WINDOWS']),
        zones: JSON.stringify(['Mallorca', 'Alicante', 'Valencia']),
        certifications: JSON.stringify(['Marcado CE demo', 'Instalación RITE demo']),
        status: 'VERIFIED',
        verified: true,
        rating: 4.6,
        slaHours: 48,
        commissionType: 'SUCCESS_FEE',
        commissionRate: 6,
        attributionMonths: 9,
        source: 'partner',
        partnerId: realEstatePartner.id,
      },
      {
        name: 'Demo Aislamientos Mediterráneos',
        legalName: 'Demo Aislamientos Mediterráneos S.L.',
        contactName: 'Coordinación Demo Aislamiento',
        email: 'aislamiento.demo@anclora.local',
        categories: JSON.stringify(['INSULATION', 'REFORM']),
        zones: JSON.stringify(['Mallorca', 'Murcia', 'Castellón']),
        certifications: JSON.stringify(['SATE demo', 'Insuflado demo']),
        status: 'VERIFIED',
        verified: true,
        rating: 4.7,
        slaHours: 72,
        commissionType: 'SUCCESS_FEE',
        commissionRate: 5,
        attributionMonths: 12,
        source: 'partner',
        partnerId: technicalPartner.id,
      },
      {
        name: 'Demo Solar y Renovables Residencial',
        legalName: 'Demo Solar y Renovables Residencial S.L.',
        contactName: 'Consultor Demo Solar',
        email: 'solar.demo@anclora.local',
        categories: JSON.stringify(['SOLAR']),
        zones: JSON.stringify(['Mallorca', 'Illes Balears', 'Nacional']),
        certifications: JSON.stringify(['Instalador baja tensión demo', 'Autoconsumo demo']),
        status: 'PREFERRED',
        verified: true,
        rating: 4.5,
        slaHours: 48,
        commissionType: 'HYBRID',
        commissionRate: 4,
        leadFeeCents: 1200,
        attributionMonths: 12,
        source: 'internal',
      },
      {
        name: 'Demo Climatización y Aerotermia',
        legalName: 'Demo Climatización y Aerotermia S.L.',
        contactName: 'Asesor Demo HVAC',
        email: 'clima.demo@anclora.local',
        categories: JSON.stringify(['HVAC']),
        zones: JSON.stringify(['Mallorca', 'Barcelona', 'Valencia']),
        certifications: JSON.stringify(['RITE demo', 'Manipulación gases fluorados demo']),
        status: 'VERIFIED',
        verified: true,
        rating: 4.4,
        slaHours: 36,
        commissionType: 'SUCCESS_FEE',
        commissionRate: 3,
        attributionMonths: 9,
        source: 'inbound',
        partnerId: technicalPartner.id,
      },
    ],
  })
  console.log('Partners and providers seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
