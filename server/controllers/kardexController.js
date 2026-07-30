import express from 'express'
import * as moveRepo from '../repositories/moveRepository.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await moveRepo.getAllMoves()
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

export default router
