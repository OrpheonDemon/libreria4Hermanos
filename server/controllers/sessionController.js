import express from 'express'
import * as repo from '../repositories/sessionRepository.js'

const router = express.Router()

router.get('/active', async (req, res) => {
  try {
    const session = await repo.getActiveSession()
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.get('/', async (req, res) => {
  try {
    const rows = await repo.listSessions()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    if (isNaN(Number(body.id_usuario))) return res.status(400).json({ error: 'id_usuario is required' })
    const fixedAmount = 200
    const toCreate = {
      fecha: body.fecha || new Date().toISOString().slice(0,10),
      fecha_inicio: body.fecha_inicio || new Date().toISOString(),
      fecha_fin: body.fecha_fin || null,
      fondo_inicial: fixedAmount,
      monto_esperado: fixedAmount,
      monto_actual: fixedAmount,
      diferencia: 0,
      observacion: body.observacion || '',
      estado: 'abierta',
      id_usuario: Number(body.id_usuario),
    }
    const s = await repo.createSession(toCreate)
    res.status(201).json(s)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

router.post('/:id/close', async (req, res) => {
  try {
    const body = req.body || {}
    const sessionId = Number(req.params.id)
    const diferencia = Number(body.diferencia || 0)
    if (!sessionId) return res.status(400).json({ error: 'Invalid session id' })
    const session = await repo.closeSession(sessionId, new Date().toISOString(), diferencia)
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
