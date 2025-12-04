import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { UsersService } from '../services/users'

const router: ExpressRouter = Router()
const usersService = new UsersService()

const addressSchema = z.object({
  params: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  }),
})

const querySchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(1000).optional().default(50),
    offset: z.coerce.number().min(0).max(100000).optional().default(0),
  }),
})

// Helper to verify the authenticated user matches the requested address
function verifyAddressOwnership(req: import('express').Request, res: import('express').Response, requestedAddress: string): boolean {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    })
    return false
  }

  if (req.user.address.toLowerCase() !== requestedAddress.toLowerCase()) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own data',
    })
    return false
  }

  return true
}

// GET /api/users/:address
router.get(
  '/:address',
  requireAuth,
  validate(addressSchema),
  async (req, res, next) => {
    try {
      if (!verifyAddressOwnership(req, res, req.params.address)) return
      const user = await usersService.getUserByAddress(req.params.address)
      res.json(user)
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/users/:address/portfolio
router.get(
  '/:address/portfolio',
  requireAuth,
  validate(addressSchema),
  async (req, res, next) => {
    try {
      if (!verifyAddressOwnership(req, res, req.params.address)) return
      const portfolio = await usersService.getUserPortfolio(req.params.address)
      res.json(portfolio)
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/users/:address/transactions
router.get(
  '/:address/transactions',
  requireAuth,
  validate(addressSchema.merge(querySchema)),
  async (req, res, next) => {
    try {
      if (!verifyAddressOwnership(req, res, req.params.address)) return
      const { limit = 50, offset = 0 } = req.query
      const transactions = await usersService.getUserTransactions(
        req.params.address,
        Number(limit),
        Number(offset)
      )
      res.json(transactions)
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/users/:address/positions
router.get(
  '/:address/positions',
  requireAuth,
  validate(addressSchema),
  async (req, res, next) => {
    try {
      if (!verifyAddressOwnership(req, res, req.params.address)) return
      const positions = await usersService.getUserPositions(req.params.address)
      res.json(positions)
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/users
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      body: z.object({
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        ensName: z.string().optional(),
        avatar: z.string().url().optional(),
      }),
    })

    const { body } = await schema.parseAsync({ body: req.body })

    // requireAuth middleware guarantees req.user exists - explicit check for type safety
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
      return
    }

    // Verify that the address in the request body matches the authenticated user's address
    if (body.address.toLowerCase() !== req.user.address.toLowerCase()) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only create/update your own user profile',
      })
      return
    }

    const user = await usersService.createOrUpdateUser(body.address, {
      ensName: body.ensName,
      avatar: body.avatar,
    })

    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
})

export default router
