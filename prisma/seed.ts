import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding providers...')
  
  await prisma.provider.deleteMany({})

  await prisma.provider.createMany({
    data: [
      {
        name: 'RehabEco Soluciones',
        categories: JSON.stringify(['Aislamiento', 'Ventanas', 'Climatización']),
        zones: JSON.stringify(['Madrid', 'Toledo', 'Guadalajara']),
        verified: true,
        rating: 4.8
      },
      {
        name: 'SolarTech Renovable',
        categories: JSON.stringify(['Fotovoltaica', 'ACS']),
        zones: JSON.stringify(['Nacional']),
        verified: true,
        rating: 4.5
      },
      {
        name: 'CertificaYa Energético',
        categories: JSON.stringify(['Certificadores']),
        zones: JSON.stringify(['Barcelona', 'Madrid', 'Valencia']),
        verified: true,
        rating: 4.9
      }
    ]
  })
  console.log('Providers seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
