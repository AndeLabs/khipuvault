import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { PoolsService } from '../services/pools'

const router: ExpressRouter = Router()
const poolsService = new PoolsService()

const poolIdSchema = z.object({
  params: z.object({
    poolId: z.string(),
  }),
})

const addressSchema = z.object({
  params: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  }),
})

const analyticsSchema = z.object({
  params: z.object({
    poolId: z.string(),
  }),
  query: z.object({
    days: z.string().optional().transform(Number),
  }),
})

// GET /api/pools
router.get('/', async (req, res, next) => {
  try {
    const pools = await poolsService.getAllPools()
    res.json(pools)
  } catch (error) {
    next(error)
  }
})

// GET /api/pools/:poolId
router.get(
  '/:poolId',
  validate(poolIdSchema),
  async (req, res, next) => {
    try {
      const pool = await poolsService.getPoolById(req.params.poolId)
      res.json(pool)
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/pools/address/:address
router.get(
  '/address/:address',
  validate(addressSchema),
  async (req, res, next) => {
    try {
      const pool = await poolsService.getPoolByAddress(req.params.address)
      res.json(pool)
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/pools/:poolId/analytics
router.get(
  '/:poolId/analytics',
  validate(analyticsSchema),
  async (req, res, next) => {
    try {
      const { days = 30 } = req.query
      const analytics = await poolsService.getPoolAnalytics(
        req.params.poolId,
        Number(days)
      )
      res.json(analytics)
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/pools/address/:address/users
router.get(
  '/address/:address/users',
  validate(addressSchema),
  async (req, res, next) => {
    try {
      const users = await poolsService.getPoolUsers(req.params.address)
      res.json(users)
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/pools/address/:address/refresh
router.post(
  '/address/:address/refresh',
  validate(addressSchema),
  async (req, res, next) => {
    try {
      const pool = await poolsService.updatePoolStats(req.params.address)
      res.json(pool)
    } catch (error) {
      next(error)
    }
  }
)

export default router
