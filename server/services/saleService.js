import * as saleRepo from '../repositories/saleRepository.js'
import * as productRepo from '../repositories/productRepository.js'
import * as moveRepo from '../repositories/moveRepository.js'
import * as sessionRepo from '../repositories/sessionRepository.js'

export async function createSale(sale) {
  const created = await saleRepo.createSale(sale)
  for (const it of sale.items) {
    const prod = await productRepo.getProductById(it.producto_id)
    const stockAnterior = prod?.stock_actual ?? 0
    const stockNuevo = Math.max(0, stockAnterior - it.cantidad)
    await productRepo.updateProductStock(it.producto_id, stockNuevo)
    await moveRepo.createMove({
      fecha: new Date().toISOString(),
      tipo_movimiento: 'Salida',
      cantidad: it.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      costo_unitario: prod?.costo_promedio ?? 0,
      observacion: `Venta ${created.numero_venta}`,
      estado: 'Activo',
      id_producto: it.producto_id,
      id_usuario: sale.id_usuario,
      id_venta: created.id,
    })
  }

  if (sale.caja_session_id && typeof sale.total === 'number') {
    const session = await sessionRepo.getSessionById(sale.caja_session_id)
    if (session) {
      const monto_actual = (session.monto_actual ?? 0) + sale.total
      const monto_esperado = (session.monto_esperado ?? 0) + sale.total
      const diferencia = monto_actual - monto_esperado
      await sessionRepo.updateSessionAmounts(sale.caja_session_id, monto_actual, monto_esperado, diferencia)
    }
  }

  return saleRepo.getSaleById(created.id)
}

export async function getSale(id) {
  return saleRepo.getSaleById(id)
}

export async function listSales(date) {
  return saleRepo.listSales(date)
}
