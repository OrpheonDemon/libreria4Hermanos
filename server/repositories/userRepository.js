import { getDB } from '../db.js'

export async function getUserByEmail(email) {
  const db = await getDB()
  return db.get('SELECT id, nombre, email, rol, estado, password_hash FROM users WHERE email = ?', email)
}

export async function getAllUsers() {
  const db = await getDB()
  return db.all('SELECT id, nombre, email, rol, estado, fecha_creacion FROM users ORDER BY nombre ASC')
}

export async function createUser(user) {
  const db = await getDB()
  const res = await db.run('INSERT INTO users (nombre, email, rol, password_hash, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)', user.nombre, user.email, user.rol || 'cajero', user.password_hash, user.estado || 'Activo', user.fecha_creacion || new Date().toISOString().slice(0, 19).replace('T', ' '))
  return db.get('SELECT id, nombre, email, rol, estado, fecha_creacion FROM users WHERE id = ?', res.lastID)
}

export async function updateUser(id, user) {
  const db = await getDB()
  await db.run('UPDATE users SET nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?', user.nombre, user.email, user.rol || 'cajero', user.estado || 'Activo', id)
  return db.get('SELECT id, nombre, email, rol, estado, fecha_creacion FROM users WHERE id = ?', id)
}

export async function deleteUser(id) {
  const db = await getDB()
  await db.run('DELETE FROM users WHERE id = ?', id)
}
