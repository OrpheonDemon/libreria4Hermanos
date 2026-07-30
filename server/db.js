import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import crypto from 'crypto'
import path from 'path'

const DB_PATH = path.resolve('./server/data.db')

const hashPassword = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

export async function getDB() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  })
  return db
}

export async function initDB() {
  const db = await getDB()
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT,
      nombre TEXT,
      descripcion TEXT,
      precio_venta REAL,
      costo_unitario REAL,
      costo_promedio REAL,
      stock_actual INTEGER,
      stock_minimo INTEGER,
      estado TEXT,
      id_categoria INTEGER,
      id_proveedor INTEGER
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_venta TEXT,
      fecha TEXT,
      subtotal REAL,
      total REAL,
      monto_recibido REAL,
      cambio REAL,
      estado TEXT,
      observacion TEXT,
      id_cliente INTEGER,
      id_usuario INTEGER,
      caja_session_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      producto_id INTEGER,
      nombre TEXT,
      cantidad INTEGER,
      precio_unitario REAL,
      subtotal REAL,
      costo_unitario REAL
    );

    CREATE TABLE IF NOT EXISTS moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      tipo_movimiento TEXT,
      cantidad INTEGER,
      stock_anterior INTEGER,
      stock_nuevo INTEGER,
      costo_unitario REAL,
      observacion TEXT,
      estado TEXT,
      id_producto INTEGER,
      id_usuario INTEGER,
      id_venta INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      fondo_inicial REAL,
      monto_esperado REAL,
      monto_actual REAL,
      diferencia REAL,
      observacion TEXT,
      estado TEXT,
      id_usuario INTEGER
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      telefono TEXT,
      email TEXT,
      direccion TEXT,
      estado TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      email TEXT UNIQUE,
      rol TEXT,
      password_hash TEXT,
      estado TEXT,
      fecha_creacion TEXT
    );
  `)

  // seed minimal products if empty
  const row = await db.get('SELECT COUNT(1) as c FROM products')
  if (row.c === 0) {
    const stmt = await db.prepare(`INSERT INTO products (codigo,nombre,descripcion,precio_venta,costo_unitario,costo_promedio,stock_actual,stock_minimo,estado,id_categoria,id_proveedor) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    await stmt.run('PRD-001','Cuaderno universitario 100 hojas','Cuaderno espiral',25,14,14,45,10,'Activo',1,1)
    await stmt.run('PRD-002','Lápiz HB Faber-Castell','Lápiz x12',18.5,9,9,8,15,'Activo',1,1)
    await stmt.finalize()
  }

  const userRow = await db.get('SELECT COUNT(1) as c FROM users')
  if (userRow.c === 0) {
    await db.run(`INSERT INTO users (nombre,email,rol,password_hash,estado,fecha_creacion) VALUES (?,?,?,?,?,?)`,
      'Administrador', 'admin@libreria.com', 'admin', hashPassword('admin123'), 'Activo', new Date().toISOString())
    await db.run(`INSERT INTO users (nombre,email,rol,password_hash,estado,fecha_creacion) VALUES (?,?,?,?,?,?)`,
      'Cajero', 'cajero@libreria.com', 'cajero', hashPassword('cajero123'), 'Activo', new Date().toISOString())
  }

  return db
}
