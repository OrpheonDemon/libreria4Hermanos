import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import productRouter from './controllers/productController.js'
import saleRouter from './controllers/saleController.js'
import moveRouter from './controllers/moveController.js'
import sessionRouter from './controllers/sessionController.js'
import clientRouter from './controllers/clientController.js'
import authRouter from './controllers/authController.js'
import { initDB } from './db.js'

const PORT = process.env.PORT || 4000

async function main() {
  await initDB()
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())

  app.use('/api/products', productRouter)
  app.use('/api/sales', saleRouter)
  app.use('/api/moves', moveRouter)
  app.use('/api/sessions', sessionRouter)
  app.use('/api/clients', clientRouter)
  app.use('/api/auth', authRouter)

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`))
}

main().catch(err => { console.error(err); process.exit(1) })
