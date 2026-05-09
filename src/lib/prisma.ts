import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL?.startsWith('postgres')
  ? process.env.DATABASE_URL
  : 'postgresql://postgres:postgres@localhost:5432/anclora_energyscan?schema=public'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({ connectionString: databaseUrl })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
