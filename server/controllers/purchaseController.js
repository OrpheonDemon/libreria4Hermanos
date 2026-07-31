import express from 'express'
import * as service from '../services/purchaseService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const purchases = await service.getPurchases()
    res.json(purchases)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const purchase = await service.purchaseInventory({
      fecha: body.fecha || new Date().toISOString(),
      id_proveedor: body.id_proveedor,
      subtotal: body.subtotal || 0,
      total: body.total || 0,
      estado: 'Completado',
      observacion: body.observacion || '',
      id_usuario: body.id_usuario || 'root',
      items: body.items,
    })
    res.status(201).json(purchase)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

export default router
