-- =========================================================
-- BASE DE DATOS: LIBRERIA 4 HERMANOS
-- Sistema de Ventas con Control de Inventario
-- y Cobros en Efectivo
-- =========================================================

DROP DATABASE IF EXISTS libreria4hermanos;
CREATE DATABASE libreria4hermanos
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE libreria4hermanos;

CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    correo VARCHAR(120) UNIQUE,
    telefono VARCHAR(30),
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NULL,
    id_rol INT NOT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES Roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB;

CREATE TABLE Proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(255),
    correo VARCHAR(120)
) ENGINE=InnoDB;

CREATE TABLE Productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    id_categoria INT NOT NULL,
    id_proveedor INT NOT NULL,
    CONSTRAINT chk_producto_precio CHECK (precio_venta >= 0),
    CONSTRAINT chk_producto_costo CHECK (costo_unitario >= 0),
    CONSTRAINT chk_producto_stock CHECK (stock_actual >= 0),
    CONSTRAINT chk_producto_stock_minimo CHECK (stock_minimo >= 0),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES Categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellido1 VARCHAR(100) NOT NULL,
    apellido2 VARCHAR(100),
    CI VARCHAR(20) UNIQUE,
    telefono VARCHAR(30),
    direccion VARCHAR(255),
    email VARCHAR(120),
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE ArqueosCaja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME NULL,
    monto_inicial DECIMAL(12,2) NOT NULL,
    monto_esperado DECIMAL(12,2),
    monto_actual DECIMAL(12,2),
    diferencia DECIMAL(12,2),
    observacion TEXT,
    estado ENUM('Abierto', 'Cerrado') NOT NULL DEFAULT 'Abierto',
    id_usuario INT NOT NULL,
    CONSTRAINT chk_arqueo_monto_inicial CHECK (monto_inicial >= 0),
    CONSTRAINT chk_arqueo_monto_esperado CHECK (monto_esperado IS NULL OR monto_esperado >= 0),
    CONSTRAINT chk_arqueo_monto_actual CHECK (monto_actual IS NULL OR monto_actual >= 0),
    CONSTRAINT fk_arqueo_usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_venta VARCHAR(20) NOT NULL UNIQUE,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    turno VARCHAR(15) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    estado ENUM('Pendiente', 'Confirmada', 'Anulada') NOT NULL DEFAULT 'Pendiente',
    observacion VARCHAR(255),
    monto_recibido DECIMAL(12,2) NOT NULL DEFAULT 0,
    cambio DECIMAL(12,2) NOT NULL DEFAULT 0,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    id_arqueo INT NULL,
    CONSTRAINT chk_venta_total CHECK (total >= 0),
    CONSTRAINT chk_venta_monto_recibido CHECK (monto_recibido >= 0),
    CONSTRAINT chk_venta_cambio CHECK (cambio >= 0),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES Clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_venta_usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_venta_arqueo FOREIGN KEY (id_arqueo) REFERENCES ArqueosCaja(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE DetalleVentas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_detalle_costo CHECK (costo_unitario >= 0),
    CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta) REFERENCES Ventas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES Productos(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE MovimientosInventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento ENUM('Entrada', 'Salida') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    costo_unitario DECIMAL(12,2),
    observacion VARCHAR(255),
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL,
    id_venta INT NULL,
    CONSTRAINT chk_movimiento_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_movimiento_stock_anterior CHECK (stock_anterior >= 0),
    CONSTRAINT chk_movimiento_stock_nuevo CHECK (stock_nuevo >= 0),
    CONSTRAINT chk_movimiento_costo CHECK (costo_unitario IS NULL OR costo_unitario >= 0),
    CONSTRAINT fk_movimiento_producto FOREIGN KEY (id_producto) REFERENCES Productos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_venta FOREIGN KEY (id_venta) REFERENCES Ventas(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE ReportesGenerados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_reporte VARCHAR(50) NOT NULL,
    filtros_aplicados TEXT,
    ruta_archivo VARCHAR(255),
    formato VARCHAR(10) NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_usuario_rol ON Usuarios(id_rol);
CREATE INDEX idx_usuario_nombre ON Usuarios(nombre, apellido);
CREATE INDEX idx_producto_categoria ON Productos(id_categoria);
CREATE INDEX idx_producto_proveedor ON Productos(id_proveedor);
CREATE INDEX idx_producto_nombre ON Productos(nombre);
CREATE INDEX idx_cliente_nombre ON Clientes(nombres, apellido1);
CREATE INDEX idx_cliente_ci ON Clientes(CI);
CREATE INDEX idx_venta_cliente ON Ventas(id_cliente);
CREATE INDEX idx_venta_usuario ON Ventas(id_usuario);
CREATE INDEX idx_venta_arqueo ON Ventas(id_arqueo);
CREATE INDEX idx_venta_fecha ON Ventas(fecha);
CREATE INDEX idx_venta_turno ON Ventas(turno);
CREATE INDEX idx_detalle_venta ON DetalleVentas(id_venta);
CREATE INDEX idx_detalle_producto ON DetalleVentas(id_producto);
CREATE INDEX idx_movimiento_producto ON MovimientosInventario(id_producto);
CREATE INDEX idx_movimiento_usuario ON MovimientosInventario(id_usuario);
CREATE INDEX idx_movimiento_venta ON MovimientosInventario(id_venta);
CREATE INDEX idx_movimiento_fecha ON MovimientosInventario(fecha);
CREATE INDEX idx_arqueo_usuario ON ArqueosCaja(id_usuario);
CREATE INDEX idx_arqueo_fecha ON ArqueosCaja(fecha_inicio);
CREATE INDEX idx_reporte_usuario ON ReportesGenerados(id_usuario);
CREATE INDEX idx_reporte_fecha ON ReportesGenerados(fecha_generacion);

INSERT INTO Roles (nombre, descripcion) VALUES
('Administrador', 'Usuario encargado de administrar el sistema'),
('Cajero', 'Usuario encargado de registrar ventas y cobros');

INSERT INTO Categorias (nombre, descripcion) VALUES
('Útiles Escolares', 'Material escolar y de oficina'),
('Papelería', 'Productos de papel y escritura'),
('Libros', 'Libros y material de lectura'),
('Material de Oficina', 'Productos para oficina');

SHOW TABLES;
