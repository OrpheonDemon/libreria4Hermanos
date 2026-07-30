import * as repo from '../repositories/providerRepository.js'

export async function listProviders() {
  return repo.getAllProviders()
}

export async function addProvider(provider) {
  if (!provider.nombre) throw new Error('Nombre es requerido')
  return repo.createProvider(provider)
}
