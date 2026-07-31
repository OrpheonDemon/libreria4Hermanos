import express from 'express'
import { getDB } from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const db = await getDB()
    const [ventasHoyRow] = await db.all('SELECT COUNT(*) AS count FROM sales WHERE DATE(fecha) = CURDATE()')
    const [montoHoyRow] = await db.all('SELECT COALESCE(SUM(total), 0) AS total FROM sales WHERE DATE(fecha) = CURDATE()')
    const [bajoStockRow] = await db.all('SELECT COUNT(*) AS count FROM products WHERE stock_actual < stock_minimo')
    const [stockRow] = await db.all('SELECT COALESCE(SUM(stock_actual), 0) AS total FROM products')

    res.json({
      ventasHoy: Number(ventasHoyRow?.count || 0),
      ventasMonto: Number(montoHoyRow?.total || 0),
      productosBajoStock: Number(bajoStockRow?.count || 0),
      totalStock: Number(stockRow?.total || 0),
    })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
