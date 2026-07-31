import { getDB } from '../db.js'

export async function createMove(m) {
  const db = await getDB()
  const res = await db.run(`INSERT INTO moves (fecha,tipo_movimiento,cantidad,stock_anterior,stock_nuevo,costo_unitario,observacion,estado,id_producto,id_usuario,id_venta,referencia,usuario,id_proveedor) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    m.fecha,
    m.tipo_movimiento,
    m.cantidad,
    m.stock_anterior,
    m.stock_nuevo,
    m.costo_unitario,
    m.observacion,
    m.estado,
    m.id_producto,
    m.id_usuario,
    m.id_venta,
    m.referencia || null,
    m.usuario || null,
    m.id_proveedor || null)
  return db.get('SELECT * FROM moves WHERE id = ?', res.lastID)
}

export async function listMoves() {
  const db = await getDB()
  return db.all('SELECT * FROM moves ORDER BY fecha DESC')
}
