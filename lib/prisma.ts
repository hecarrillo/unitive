// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaGlobal = global as typeof global & {
  prisma?: PrismaClient
}

const prisma = prismaGlobal.prisma || new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling configuration for Supabase
  // https://www.prisma.io/docs/concepts/components/prisma-client/connection-pooling


})

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}

export default prisma