import express from 'express'
import * as service from '../services/providerService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await service.listProviders()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.nombre) return res.status(400).json({ error: 'nombre is required' })
    const provider = await service.addProvider({
      nombre: body.nombre,
      email: body.email || '',
      telefono: body.telefono || '',
      direccion: body.direccion || '',
      estado: body.estado || 'Activo',
      fecha_creacion: body.fecha_creacion || new Date().toISOString(),
    })
    res.status(201).json(provider)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
