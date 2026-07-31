import * as userRepo from '../repositories/userRepository.js'
import crypto from 'crypto'

const hashPassword = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

export async function authenticate(email, password) {
  const user = await userRepo.getUserByEmail(email)
  if (!user || user.password_hash !== hashPassword(password)) return null
  const { password_hash, ...userSafe } = user
  return userSafe
}
