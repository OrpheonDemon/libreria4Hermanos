import { getDB } from '../db.js'

export async function createSale(sale) {
  const db = await getDB()
  const res = await db.run(`INSERT INTO sales (numero_venta,fecha,subtotal,total,monto_recibido,cambio,estado,observacion,id_cliente,id_usuario,caja_session_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, sale.numero_venta, sale.fecha, sale.subtotal, sale.total, sale.monto_recibido, sale.cambio, sale.estado, sale.observacion, sale.id_cliente, sale.id_usuario, sale.caja_session_id)
  const saleId = res.lastID
  for (const it of sale.items) {
    await db.run(`INSERT INTO sale_items (sale_id,producto_id,nombre,cantidad,precio_unitario,subtotal,costo_unitario) VALUES (?,?,?,?,?,?,?)`, saleId, it.producto_id, it.nombre, it.cantidad, it.precio_unitario, it.subtotal, it.costo_unitario)
  }
  return db.get('SELECT * FROM sales WHERE id = ?', saleId)
}

export async function getSaleById(id) {
  const db = await getDB()
  const sale = await db.get('SELECT * FROM sales WHERE id = ?', id)
  if (!sale) return null
  const items = await db.all('SELECT * FROM sale_items WHERE sale_id = ?', id)
  sale.items = items
  return sale
}

export async function listSales(date) {
  const db = await getDB()
  if (date) {
    return db.all('SELECT * FROM sales WHERE fecha LIKE ? ORDER BY fecha DESC', `${date}%`)
  }
  return db.all('SELECT * FROM sales ORDER BY fecha DESC')
}
