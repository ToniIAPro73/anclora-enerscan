import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL || ''
const isPostgres = databaseUrl.startsWith('postgres') || databaseUrl.startsWith('postgresql')

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  if (isPostgres) {
    try {
      const pool = new Pool({ connectionString: databaseUrl })
      return new PrismaClient({ adapter: new PrismaPg(pool) })
    } catch (error) {
      console.error('Prisma: Failed to initialize PostgreSQL adapter:', error)
    }
  }

  // Fallback for build/local without PostgreSQL: return a Proxy to avoid PrismaClientInitializationError
  // during Next.js page data collection. This allows the build to pass without a real DB.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return new Proxy({} as any, {
    get: (_target: any, prop: any) => {
      if (prop === '$on' || prop === '$connect' || prop === '$disconnect' || prop === '$use') return () => Promise.resolve()
      // Return a dummy object for model access (e.g. prisma.user.findUnique)
      return new Proxy({} as any, {
        get: () => () => {
          throw new Error(`Prisma property "${String(prop)}" is not available without a valid PostgreSQL connection.`)
        }
      })
    }
  }) as unknown as PrismaClient
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
