import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma for serverless environments (Netlify, Vercel)
// - Connection timeout: 15 seconds (Neon can be slow on cold starts)
// - Pool timeout: 10 seconds
// - Max pool size: 5 (limited for serverless)
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// In development, reuse the connection to avoid exhausting the pool
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown (important for serverless)
if (process.env.NODE_ENV === 'production') {
  // Handle cleanup on serverless function shutdown
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
