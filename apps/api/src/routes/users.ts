import { Router, type Router as ExpressRouter } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
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
    limit: z.string().optional().transform(Number),
    offset: z.string().optional().transform(Number),
  }),
})

// GET /api/users/:address
router.get(
  '/:address',
  validate(addressSchema),
  async (req, res, next) => {
    try {
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
  validate(addressSchema),
  async (req, res, next) => {
    try {
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
  validate(addressSchema.merge(querySchema)),
  async (req, res, next) => {
    try {
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
  validate(addressSchema),
  async (req, res, next) => {
    try {
      const positions = await usersService.getUserPositions(req.params.address)
      res.json(positions)
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      body: z.object({
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        ensName: z.string().optional(),
        avatar: z.string().url().optional(),
      }),
    })

    const { body } = await schema.parseAsync({ body: req.body })
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
