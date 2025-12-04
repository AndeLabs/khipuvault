import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
})

afterAll(() => {
  vi.clearAllMocks()
})

// Global test utilities
export const mockPrismaClient = () => {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    deposit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    pool: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  }
}
