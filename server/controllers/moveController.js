import express from 'express'
import * as repo from '../repositories/moveRepository.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await repo.listMoves()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
