import type { Client, Product, Session, Provider, Move } from './types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4001'

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`)
  if (!res.ok) throw new Error('Error fetching products')
  return res.json()
}

export async function decrementProductStock(id: number, qty = 1): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}/decrement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qty }) })
  if (!res.ok) throw new Error('Error decrementing')
  return res.json()
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Error creating')
  return res.json()
}

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/api/clients`)
  if (!res.ok) throw new Error('Error fetching clients')
  return res.json()
}

export async function fetchProviders(): Promise<Provider[]> {
  const res = await fetch(`${API_BASE}/api/providers`)
  if (!res.ok) throw new Error('Error fetching providers')
  return res.json()
}

export async function createPurchase(payload: any) {
  const res = await fetch(`${API_BASE}/api/purchases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error creating purchase' }))
    throw new Error(error.error || 'Error creating purchase')
  }
  return res.json()
}

export async function fetchKardex(): Promise<Move[]> {
  const res = await fetch(`${API_BASE}/api/kardex`)
  if (!res.ok) throw new Error('Error fetching kardex')
  return res.json()
}

export async function createClient(payload: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_BASE}/api/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Error creating client')
  return res.json()
}

export async function fetchActiveSession(): Promise<Session | null> {
  const res = await fetch(`${API_BASE}/api/sessions/active`)
  if (!res.ok) throw new Error('Error fetching active session')
  return res.json()
}

export async function openSession(payload: Partial<Session>) {
  const res = await fetch(`${API_BASE}/api/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Error opening session')
  return res.json()
}

export async function closeSession(id: number, diferencia: number) {
  const res = await fetch(`${API_BASE}/api/sessions/${id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diferencia }) })
  if (!res.ok) throw new Error('Error closing session')
  return res.json()
}

export async function createSale(payload: any) {
  const res = await fetch(`${API_BASE}/api/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Error creating sale')
  return res.json()
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error logging in' }))
    throw new Error(error.error || 'Error logging in')
  }
  return res.json()
}

export async function fetchMoves() {
  const res = await fetch(`${API_BASE}/api/moves`)
  if (!res.ok) throw new Error('Error fetching moves')
  return res.json()
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/api/sessions`)
  if (!res.ok) throw new Error('Error fetching sessions')
  return res.json()
}

export async function fetchDailySales(date: string) {
  const res = await fetch(`${API_BASE}/api/sales?date=${encodeURIComponent(date)}`)
  if (!res.ok) throw new Error('Error fetching daily sales')
  return res.json()
}

export async function fetchReports(): Promise<ReportSummary> {
  const res = await fetch(`${API_BASE}/api/reports`)
  if (!res.ok) throw new Error('Error fetching reports')
  return res.json()
}
