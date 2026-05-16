import { defineConfig } from '@prisma/config'
import 'dotenv/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL?.startsWith('postgres')
      ? process.env.DATABASE_URL
      : 'postgresql://postgres:postgres@localhost:5432/anclora_energyscan?schema=public',
  }
})
