import express from 'express'
import * as service from '../services/productService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await service.listProducts()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const p = await service.getProduct(+req.params.id)
    if (!p) return res.status(404).json({ error: 'No encontrado' })
    res.json(p)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/decrement', async (req, res) => {
  try {
    const qty = Number(req.body.qty || 1)
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'qty must be a positive number' })
    const updated = await service.decrementStock(+req.params.id, qty)
    res.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.nombre) return res.status(400).json({ error: 'nombre is required' })
    if (isNaN(Number(body.precio_venta))) return res.status(400).json({ error: 'precio_venta must be a number' })
    if (isNaN(Number(body.stock_actual))) return res.status(400).json({ error: 'stock_actual must be a number' })
    const p = await service.addProduct({
      codigo: body.codigo || '',
      nombre: body.nombre,
      descripcion: body.descripcion || '',
      precio_venta: Number(body.precio_venta),
      costo_unitario: Number(body.costo_unitario || 0),
      costo_promedio: Number(body.costo_promedio || 0),
      stock_actual: Number(body.stock_actual),
      stock_minimo: Number(body.stock_minimo || 0),
      estado: body.estado || 'Activo',
      id_categoria: Number(body.id_categoria || 1),
      id_proveedor: Number(body.id_proveedor || 1),
    })
    res.status(201).json(p)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

export default router
