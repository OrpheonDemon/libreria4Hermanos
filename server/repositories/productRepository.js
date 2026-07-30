import { getDB } from '../db.js'

export async function getAllProducts() {
  const db = await getDB()
  return db.all('SELECT * FROM products')
}

export async function getProductById(id) {
  const db = await getDB()
  return db.get('SELECT * FROM products WHERE id = ?', id)
}

export async function updateProductStock(id, nuevoStock) {
  const db = await getDB()
  await db.run('UPDATE products SET stock_actual = ? WHERE id = ?', nuevoStock, id)
  return getProductById(id)
}

export async function createProduct(p) {
  const db = await getDB()
  const res = await db.run(`INSERT INTO products (codigo,nombre,descripcion,precio_venta,costo_unitario,costo_promedio,stock_actual,stock_minimo,estado,id_categoria,id_proveedor) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, p.codigo,p.nombre,p.descripcion,p.precio_venta,p.costo_unitario,p.costo_promedio,p.stock_actual,p.stock_minimo,p.estado,p.id_categoria,p.id_proveedor)
  return getProductById(res.lastID)
}
