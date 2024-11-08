// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: [
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

export function createPrismaClient() {
  const prisma = new PrismaClient(prismaClientOptions)

  // Using correct event types
  prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
    if (e.duration > 5000) { // Log slow queries (>5s)
      console.warn('Slow Query:', {
        query: e.query,
        duration: e.duration,
        timestamp: e.timestamp,
      })
    }
  })

  // Handle disconnect on process exit
  if (process.env.NODE_ENV !== 'production') {
    process.on('beforeExit', async () => {
      await prisma.$disconnect()
    })
  }

  return prisma
}

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

const prisma = getPrismaClient()

// Add cleanup handler for development
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

export default prisma