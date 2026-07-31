import express from 'express'
import * as repo from '../repositories/clientRepository.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await repo.listClients()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.nombre || typeof body.nombre !== 'string') {
      return res.status(400).json({ error: 'nombre is required' })
    }
    const client = await repo.createClient({
      nombre: body.nombre,
      telefono: body.telefono || '',
      email: body.email || '',
      direccion: body.direccion || '',
      estado: body.estado || 'Activo',
    })
    res.status(201).json(client)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
