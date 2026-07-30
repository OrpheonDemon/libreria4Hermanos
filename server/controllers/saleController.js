import express from 'express'
import * as service from '../services/saleService.js'
import * as sessionRepo from '../repositories/sessionRepository.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const sale = req.body
    // basic validation
    if (!sale || !Array.isArray(sale.items) || sale.items.length === 0) return res.status(400).json({ error: 'Invalid sale: items required' })
    if (!sale.id_usuario) return res.status(400).json({ error: 'id_usuario is required' })
    // attach active session when available
    if (!sale.caja_session_id) {
      const activeSession = await sessionRepo.getActiveSession()
      if (activeSession) {
        sale.caja_session_id = activeSession.id
      }
    }
    // validate items
    for (const it of sale.items) {
      if (typeof it.producto_id !== 'number' || typeof it.cantidad !== 'number' || it.cantidad <= 0) return res.status(400).json({ error: 'Invalid item in sale' })
      if (typeof it.precio_unitario !== 'number') it.precio_unitario = Number(it.precio_unitario || 0)
      it.subtotal = Number(it.subtotal || (it.precio_unitario * it.cantidad))
    }
    sale.numero_venta = sale.numero_venta || `V-${Date.now()}`
    sale.fecha = sale.fecha || new Date().toISOString()
    sale.estado = sale.estado || 'Confirmada'
    const created = await service.createSale(sale)
    res.status(201).json(created)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

router.get('/', async (req, res) => {
  try {
    const date = req.query.date ? String(req.query.date) : undefined
    const rows = await service.listSales(date)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const s = await service.getSale(+req.params.id)
    if (!s) return res.status(404).json({ error: 'Not found' })
    res.json(s)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
