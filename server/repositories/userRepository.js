import { getDB } from '../db.js'

export async function getUserByEmail(email) {
  const db = await getDB()
  return db.get('SELECT id, nombre, email, rol, estado, password_hash FROM users WHERE email = ?', email)
}
