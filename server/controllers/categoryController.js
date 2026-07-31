import express from 'express'
import * as service from '../services/categoryService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    res.json(await service.listCategories())
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const category = await service.addCategory(req.body || {})
    res.status(201).json(category)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const category = await service.editCategory(+req.params.id, req.body || {})
    res.json(category)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await service.removeCategory(+req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
