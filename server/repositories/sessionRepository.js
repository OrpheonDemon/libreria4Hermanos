import { getDB } from '../db.js'

export async function createSession(s) {
  const db = await getDB()
  const res = await db.run(
    `INSERT INTO sessions (fecha,fecha_inicio,fecha_fin,fondo_inicial,monto_esperado,monto_actual,diferencia,observacion,estado,id_usuario) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    s.fecha,
    s.fecha_inicio,
    s.fecha_fin,
    s.fondo_inicial,
    s.monto_esperado,
    s.monto_actual,
    s.diferencia,
    s.observacion,
    s.estado,
    s.id_usuario
  )
  return db.get('SELECT * FROM sessions WHERE id = ?', res.lastID)
}

export async function getSessionById(id) {
  const db = await getDB()
  return db.get('SELECT * FROM sessions WHERE id = ?', id)
}

export async function getActiveSession() {
  const db = await getDB()
  return db.get('SELECT * FROM sessions WHERE estado = ? ORDER BY fecha_inicio DESC LIMIT 1', 'abierta')
}

export async function updateSessionAmounts(id, monto_actual, monto_esperado, diferencia) {
  const db = await getDB()
  await db.run('UPDATE sessions SET monto_actual = ?, monto_esperado = ?, diferencia = ? WHERE id = ?', monto_actual, monto_esperado, diferencia, id)
  return getSessionById(id)
}

export async function closeSession(id, fecha_fin, diferencia) {
  const db = await getDB()
  await db.run('UPDATE sessions SET fecha_fin = ?, diferencia = ?, estado = ? WHERE id = ?', fecha_fin, diferencia, 'cerrada', id)
  return getSessionById(id)
}

export async function listSessions() {
  const db = await getDB()
  return db.all('SELECT * FROM sessions ORDER BY fecha DESC')
}
