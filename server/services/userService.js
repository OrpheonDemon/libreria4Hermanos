import * as repo from '../repositories/userRepository.js'
import crypto from 'crypto'

const hashPassword = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

export async function listUsers() {
  return repo.getAllUsers()
}

export async function addUser(user) {
  if (!user.nombre || !user.email || !user.password_hash) throw new Error('Nombre, email y contraseña son requeridos')
  return repo.createUser({ ...user, password_hash: hashPassword(user.password_hash) })
}

export async function editUser(id, user) {
  return repo.updateUser(id, user)
}

export async function removeUser(id) {
  return repo.deleteUser(id)
}
