import { getDB } from '../db.js'

export async function getAllProviders() {
  const db = await getDB()
  return db.all('SELECT * FROM providers ORDER BY nombre ASC')
}

export async function getProviderById(id) {
  const db = await getDB()
  return db.get('SELECT * FROM providers WHERE id = ?', id)
}

export async function createProvider(provider) {
  const db = await getDB()
  const result = await db.run(
    `INSERT INTO providers (nombre, email, telefono, direccion, estado, fecha_creacion) VALUES (?,?,?,?,?,?)`,
    provider.nombre,
    provider.email || '',
    provider.telefono || '',
    provider.direccion || '',
    provider.estado || 'Activo',
    provider.fecha_creacion || new Date().toISOString()
  )
  return db.get('SELECT * FROM providers WHERE id = ?', result.lastID)
}
