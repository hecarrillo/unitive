// lib/utils/prisma-utils.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { getPrismaClient } from './prisma'

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 100,
}

export class PrismaError extends Error {
  constructor(
    message: string,
    public readonly originalError: unknown
  ) {
    super(message)
    this.name = 'PrismaError'
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isPrismaConnectionError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Connection errors usually have these error codes
    return ['P1001', 'P1002', 'P1003', 'P1017'].includes(error.code)
  }
  
  if (error instanceof Error) {
    return (
      error.message.includes('prepared statement') ||
      error.message.includes('Connection pool timeout') ||
      error.message.includes('Connection refused')
    )
  }
  
  return false
}

export async function withPrismaRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, delayMs } = { ...defaultRetryOptions, ...options }
  let lastError: unknown
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const prisma = getPrismaClient()
      return await operation(prisma)
    } catch (error) {
      lastError = error
      retryCount++

      if (isPrismaConnectionError(error)) {
        console.warn(
          `Database operation failed (attempt ${retryCount}/${maxRetries}):`,
          error
        )
        await delay(delayMs * retryCount)
        continue
      }

      throw new PrismaError('Database operation failed', error)
    }
  }

  throw new PrismaError(
    `Operation failed after ${maxRetries} retries`,
    lastError
  )
}