import { getDB } from '../db.js'

export async function createPurchase(purchase) {
  const db = await getDB()
  const res = await db.run(
    `INSERT INTO purchases (fecha,id_proveedor,subtotal,total,estado,observacion,id_usuario) VALUES (?,?,?,?,?,?,?)`,
    purchase.fecha,
    purchase.id_proveedor,
    purchase.subtotal,
    purchase.total,
    purchase.estado,
    purchase.observacion,
    purchase.id_usuario
  )
  return db.get('SELECT * FROM purchases WHERE id = ?', res.lastID)
}

export async function createPurchaseItem(item) {
  const db = await getDB()
  const res = await db.run(
    `INSERT INTO purchase_items (purchase_id, producto_id, cantidad, precio_unitario, subtotal, costo_unitario) VALUES (?,?,?,?,?,?)`,
    item.purchase_id,
    item.producto_id,
    item.cantidad,
    item.precio_unitario,
    item.subtotal,
    item.costo_unitario
  )
  return db.get('SELECT * FROM purchase_items WHERE id = ?', res.lastID)
}

export async function getPurchaseById(id) {
  const db = await getDB()
  const purchase = await db.get('SELECT * FROM purchases WHERE id = ?', id)
  if (!purchase) return null
  const items = await db.all('SELECT * FROM purchase_items WHERE purchase_id = ?', id)
  return { ...purchase, items }
}

export async function listPurchases() {
  const db = await getDB()
  return db.all('SELECT p.*, prov.nombre as proveedor_nombre FROM purchases p LEFT JOIN providers prov ON prov.id = p.id_proveedor ORDER BY p.fecha DESC')
}
