import { getDB } from '../db.js'

export async function listClients() {
  const db = await getDB()
  return db.all('SELECT * FROM clients ORDER BY nombre')
}

export async function createClient(client) {
  const db = await getDB()
  const res = await db.run(
    `INSERT INTO clients (nombre, telefono, email, direccion, estado) VALUES (?,?,?,?,?)`,
    client.nombre,
    client.telefono || '',
    client.email || '',
    client.direccion || '',
    client.estado || 'Activo'
  )
  return db.get('SELECT * FROM clients WHERE id = ?', res.lastID)
}

export async function getClientById(id) {
  const db = await getDB()
  return db.get('SELECT * FROM clients WHERE id = ?', id)
}
