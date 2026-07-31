import * as repo from '../repositories/categoryRepository.js'

export async function listCategories() {
  return repo.getAllCategories()
}

export async function addCategory(category) {
  if (!category.nombre) throw new Error('Nombre es requerido')
  return repo.createCategory(category)
}

export async function editCategory(id, category) {
  return repo.updateCategory(id, category)
}

export async function removeCategory(id) {
  return repo.deleteCategory(id)
}
