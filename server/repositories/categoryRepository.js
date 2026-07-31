import { getDB } from '../db.js'

export async function getAllCategories() {
  const db = await getDB()
  return db.all('SELECT * FROM categories ORDER BY nombre ASC')
}

export async function createCategory(category) {
  const db = await getDB()
  const res = await db.run('INSERT INTO categories (nombre, descripcion, estado) VALUES (?, ?, ?)', category.nombre, category.descripcion || '', category.estado || 'Activo')
  return db.get('SELECT * FROM categories WHERE id = ?', res.lastID)
}

export async function updateCategory(id, category) {
  const db = await getDB()
  await db.run('UPDATE categories SET nombre = ?, descripcion = ?, estado = ? WHERE id = ?', category.nombre, category.descripcion || '', category.estado || 'Activo', id)
  return db.get('SELECT * FROM categories WHERE id = ?', id)
}

export async function deleteCategory(id) {
  const db = await getDB()
  await db.run('DELETE FROM categories WHERE id = ?', id)
}
