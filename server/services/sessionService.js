import * as repo from '../repositories/sessionRepository.js'

export async function getActiveSession() {
  return repo.getActiveSession()
}

export async function updateSessionAmounts(sessionId, montoActualDelta, montoEsperadoDelta) {
  const session = await repo.getSessionById(sessionId)
  if (!session) throw new Error('Session not found')
  const monto_actual = (session.monto_actual ?? 0) + montoActualDelta
  const monto_esperado = (session.monto_esperado ?? 0) + montoEsperadoDelta
  const diferencia = monto_actual - monto_esperado
  return repo.updateSessionAmounts(sessionId, monto_actual, monto_esperado, diferencia)
}

export async function closeSession(id, diferencia) {
  const fecha_fin = new Date().toISOString()
  return repo.closeSession(id, fecha_fin, diferencia)
}
