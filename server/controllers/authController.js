import express from 'express'
import * as authService from '../services/authService.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
    const user = await authService.authenticate(String(email), String(password))
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

export default router
