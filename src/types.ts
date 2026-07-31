export interface Product {
  id: number
  codigo?: string
  nombre: string
  descripcion?: string
  precio_venta: number
  costo_unitario?: number
  costo_promedio?: number
  stock_actual: number
  stock_minimo?: number
  estado?: string
  id_categoria?: number
  id_proveedor?: number
}

export interface Client {
  id: number
  nombre: string
  telefono: string
  email: string
  direccion: string
  estado: string
}

export interface Session {
  id: number
  fecha: string
  fecha_inicio: string
  fecha_fin: string | null
  fondo_inicial: number
  monto_esperado: number
  monto_actual: number
  diferencia: number
  observacion: string
  estado: string
  id_usuario: number
}

export interface Provider {
  id: number
  nombre: string
  email: string
  telefono: string
  direccion: string
  estado: string
}

export interface Move {
  id: number
  fecha: string
  tipo_movimiento: string
  cantidad: number
  stock_anterior: number | null
  stock_nuevo: number | null
  costo_unitario: number | null
  observacion: string
  estado: string
  id_producto: number | null
  id_usuario: number | null
  id_venta: number | null
  referencia?: string | null
  usuario?: string | null
  id_proveedor?: number | null
}

export interface User {
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'cajero'
  estado: string
}

export interface ReportSummary {
  ventasHoy: number
  ventasMonto: number
  productosBajoStock: number
  totalStock: number
}
