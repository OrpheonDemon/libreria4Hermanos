import express from 'express'
import * as service from '../services/userService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    res.json(await service.listUsers())
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const user = await service.addUser(req.body || {})
    res.status(201).json(user)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const user = await service.editUser(+req.params.id, req.body || {})
    res.json(user)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await service.removeUser(+req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
