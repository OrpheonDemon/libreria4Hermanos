import * as repo from '../repositories/productRepository.js'

export async function listProducts() {
  return repo.getAllProducts()
}

export async function getProduct(id) {
  return repo.getProductById(id)
}

export async function decrementStock(productoId, qty) {
  const p = await repo.getProductById(productoId)
  if (!p) throw new Error('Producto no encontrado')
  const nuevo = Math.max(0, p.stock_actual - qty)
  return repo.updateProductStock(productoId, nuevo)
}

export async function addProduct(p) {
  return repo.createProduct(p)
}
