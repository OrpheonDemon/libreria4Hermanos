import * as purchaseRepo from '../repositories/purchaseRepository.js'
import * as productRepo from '../repositories/productRepository.js'
import * as moveRepo from '../repositories/moveRepository.js'

export async function purchaseInventory(purchase) {
  if (!purchase.id_proveedor) throw new Error('Proveedor es requerido')
  if (!purchase.items || !Array.isArray(purchase.items) || purchase.items.length === 0) {
    throw new Error('Debes agregar al menos un item de compra')
  }

  const createdPurchase = await purchaseRepo.createPurchase(purchase)

  for (const item of purchase.items) {
    if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
      throw new Error('Cada item requiere producto, cantidad y precio_unitario')
    }
    const subtotal = item.cantidad * item.precio_unitario
    await purchaseRepo.createPurchaseItem({
      purchase_id: createdPurchase.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal,
      costo_unitario: item.precio_unitario,
    })

    const producto = await productRepo.getProductById(item.producto_id)
    if (!producto) throw new Error(`Producto no encontrado: ${item.producto_id}`)

    const stockAnterior = producto.stock_actual ?? 0
    const nuevoStock = stockAnterior + item.cantidad
    await productRepo.updateProduct(item.producto_id, {
      ...producto,
      stock_actual: nuevoStock,
      precio_venta: producto.precio_venta ?? item.precio_unitario,
    })

    const movimiento = {
      fecha: purchase.fecha || new Date().toISOString(),
      tipo_movimiento: 'Compra',
      cantidad: item.cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: nuevoStock,
      costo_unitario: item.precio_unitario,
      observacion: `Compra a proveedor ${purchase.id_proveedor}`,
      estado: 'Activo',
      id_producto: item.producto_id,
      id_usuario: purchase.id_usuario || null,
      id_venta: null,
      referencia: `COMPRA-${createdPurchase.id}`,
      usuario: String(purchase.id_usuario || 'root'),
      id_proveedor: purchase.id_proveedor,
    }
    await moveRepo.createMove(movimiento)
  }

  return purchaseRepo.getPurchaseById(createdPurchase.id)
}

export async function getPurchases() {
  return purchaseRepo.listPurchases()
}
