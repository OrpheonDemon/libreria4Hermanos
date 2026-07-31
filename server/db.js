import mysql from 'mysql2/promise'
import crypto from 'crypto'

const DB_NAME = 'libreria4hermanos'
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '0000',
  charset: 'utf8mb4',
  multipleStatements: true
}

let pool = null

async function createAdminPool() {
  return mysql.createPool({
    ...DB_CONFIG,
    database: undefined
  })
}

async function ensureDatabase() {
  const adminPool = await createAdminPool()
  try {
    await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } finally {
    await adminPool.end()
  }
}

export async function getPool() {
  if (!pool) {
    await ensureDatabase()
    pool = mysql.createPool({
      ...DB_CONFIG,
      database: DB_NAME
    })
  }
  return pool
}

export async function getDB() {
  const dbPool = await getPool()

  return {
    async all(sql, ...params) {
      const [rows] = await dbPool.query(sql, params)
      return rows
    },

    async get(sql, ...params) {
      const [rows] = await dbPool.query(sql, params)
      return rows[0] || null
    },

    async run(sql, ...params) {
      const [result] = await dbPool.execute(sql, params)
      return {
        lastID: result.insertId || 0,
        changes: result.affectedRows || 0
      }
    },

    async exec(sql) {
      await dbPool.query(sql)
      return null
    }
  }
}

const hashPassword = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

export async function initDB() {
  const db = await getDB()
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo VARCHAR(50) NOT NULL UNIQUE,
      nombre VARCHAR(150) NOT NULL,
      descripcion TEXT,
      precio_venta DECIMAL(12,2) NOT NULL,
      costo_unitario DECIMAL(12,2) NOT NULL,
      costo_promedio DECIMAL(12,2) DEFAULT 0,
      stock_actual INT NOT NULL DEFAULT 0,
      stock_minimo INT NOT NULL DEFAULT 0,
      estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
      id_categoria INT DEFAULT 1,
      id_proveedor INT DEFAULT 1
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero_venta VARCHAR(50) NOT NULL UNIQUE,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      monto_recibido DECIMAL(12,2) NOT NULL DEFAULT 0,
      cambio DECIMAL(12,2) NOT NULL DEFAULT 0,
      estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
      observacion TEXT,
      id_cliente INT DEFAULT 0,
      id_usuario INT DEFAULT 0,
      caja_session_id INT DEFAULT 0
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS sale_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sale_id INT NOT NULL,
      producto_id INT NOT NULL,
      nombre VARCHAR(150) NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS moves (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      tipo_movimiento VARCHAR(20) NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      stock_anterior INT NOT NULL DEFAULT 0,
      stock_nuevo INT NOT NULL DEFAULT 0,
      costo_unitario DECIMAL(12,2) DEFAULT 0,
      observacion TEXT,
      estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
      id_producto INT NOT NULL,
      id_usuario INT NOT NULL,
      id_venta INT DEFAULT NULL,
      referencia VARCHAR(255),
      usuario VARCHAR(100),
      id_proveedor INT DEFAULT NULL
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_inicio DATETIME NOT NULL,
      fecha_fin DATETIME DEFAULT NULL,
      fondo_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
      monto_esperado DECIMAL(12,2) DEFAULT 0,
      monto_actual DECIMAL(12,2) DEFAULT 0,
      diferencia DECIMAL(12,2) DEFAULT 0,
      observacion TEXT,
      estado VARCHAR(20) NOT NULL DEFAULT 'abierta',
      id_usuario INT DEFAULT 0
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      telefono VARCHAR(30),
      email VARCHAR(150),
      direccion VARCHAR(255),
      estado VARCHAR(20) NOT NULL DEFAULT 'Activo'
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      email VARCHAR(150),
      telefono VARCHAR(30),
      direccion VARCHAR(255),
      estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_proveedor INT NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
      observacion TEXT,
      id_usuario INT NOT NULL
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      purchase_id INT NOT NULL,
      producto_id INT NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      rol VARCHAR(50) NOT NULL DEFAULT 'cajero',
      password_hash VARCHAR(255) NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `)

  const productCount = await db.get('SELECT COUNT(*) AS c FROM products')
  if (productCount.c === 0) {
    await db.run(
      'INSERT INTO products (codigo, nombre, descripcion, precio_venta, costo_unitario, costo_promedio, stock_actual, stock_minimo, estado, id_categoria, id_proveedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      'PRD-001', 'Cuaderno universitario 100 hojas', 'Cuaderno espiral', 25, 14, 14, 45, 10, 'Activo', 1, 1
    )
    await db.run(
      'INSERT INTO products (codigo, nombre, descripcion, precio_venta, costo_unitario, costo_promedio, stock_actual, stock_minimo, estado, id_categoria, id_proveedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      'PRD-002', 'Lápiz HB Faber-Castell', 'Lápiz x12', 18.5, 9, 9, 8, 15, 'Activo', 1, 1
    )
  }

  const userCount = await db.get('SELECT COUNT(*) AS c FROM users')
  if (userCount.c === 0) {
    await db.run(
      'INSERT INTO users (nombre, email, rol, password_hash, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)',
      'Root', 'root@libreria.com', 'admin', hashPassword('0000'), 'Activo', now
    )
    await db.run(
      'INSERT INTO users (nombre, email, rol, password_hash, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)',
      'Administrador', 'admin@libreria.com', 'admin', hashPassword('admin123'), 'Activo', now
    )
    await db.run(
      'INSERT INTO users (nombre, email, rol, password_hash, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)',
      'Cajero', 'cajero@libreria.com', 'cajero', hashPassword('cajero123'), 'Activo', now
    )
  }

  const providerCount = await db.get('SELECT COUNT(*) AS c FROM providers')
  if (providerCount.c === 0) {
    await db.run(
      'INSERT INTO providers (nombre, email, telefono, direccion, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)',
      'Proveedor Central', 'ventas@proveedor.com', '+59171234567', 'Av. Central #123', 'Activo', now
    )
  }

  return db
}
