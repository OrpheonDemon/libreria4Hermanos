import { useEffect, useState, type FormEvent } from 'react'
import { fetchProducts, decrementProductStock, createSale, fetchClients, fetchActiveSession, openSession, closeSession, createClient, fetchDailySales, loginUser } from './api'
import type { Client, Product, Session, User } from './types'

type PageView = 'inicio' | 'ventas' | 'ventas-del-dia' | 'arqueo' | 'inventario' | 'clientes'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    maximumFractionDigits: 2,
  }).format(value)

export default function App() {
  const [role, setRole] = useState<'cajero' | 'admin'>('cajero')
  const [page, setPage] = useState<PageView>('inicio')
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [dailySales, setDailySales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [cart, setCart] = useState<{ producto_id: number; nombre: string; cantidad: number; precio_unitario: number }[]>([])
  const [clienteActivo, setClienteActivo] = useState<Client | null>(null)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')

    try {
      const user = await loginUser(loginForm.username, loginForm.password)
      setCurrentUser(user)
      setRole(user.rol === 'admin' ? 'admin' : 'cajero')
      setPage('inicio')
      setAuthenticated(true)
      setLoginForm({ username: '', password: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setLoginError(msg)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, c, s] = await Promise.all([fetchProducts(), fetchClients(), fetchActiveSession()])
      setProducts(p)
      setClients(c)
      setActiveSession(s)
      await loadDailySales()
    } catch {
      setProducts([])
      setClients([])
      setActiveSession(null)
      setDailySales([])
    } finally {
      setLoading(false)
    }
  }

  const loadDailySales = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const sales = await fetchDailySales(today)
      setDailySales(sales)
    } catch {
      setDailySales([])
    }
  }

  const openCashSession = async () => {
    if (!currentUser) return alert('Debes iniciar sesión para abrir caja')
    try {
      await openSession({ id_usuario: currentUser.id })
      alert('Caja abierta con Bs. 200')
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Error abriendo caja: ' + msg)
    }
  }

  const closeCashSession = async () => {
    if (!activeSession) return alert('No hay caja abierta')
    try {
      const diferencia = (activeSession.monto_actual ?? 0) - (activeSession.monto_esperado ?? 0)
      await closeSession(activeSession.id, diferencia)
      alert('Caja cerrada')
      setActiveSession(null)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Error cerrando caja: ' + msg)
    }
  }

  const createNewClient = async () => {
    if (!clientName.trim()) return alert('Nombre de cliente es requerido')
    try {
      await createClient({ nombre: clientName.trim(), email: clientEmail.trim(), telefono: clientPhone.trim(), direccion: clientAddress.trim() })
      alert('Cliente registrado')
      setClientName('')
      setClientEmail('')
      setClientPhone('')
      setClientAddress('')
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Error creando cliente: ' + msg)
    }
  }

  const sellOne = async (id: number) => {
    try {
      const updated = await decrementProductStock(id, 1)
      setProducts(prev => prev.map(x => x.id === updated.id ? updated : x))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Error al vender: ' + msg)
    }
  }

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(x => x.producto_id === p.id)
      if (ex) return prev.map(x => x.producto_id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x)
      return [...prev, { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: p.precio_venta }]
    })
  }

  const submitSale = async () => {
    if (cart.length === 0) return alert('Carrito vacío')
    if (!activeSession) return alert('Debe abrir una caja antes de realizar ventas')
    const total = cart.reduce((s, c) => s + c.precio_unitario * c.cantidad, 0)
    const payload = {
      numero_venta: `V-${Date.now()}`,
      fecha: new Date().toISOString(),
      subtotal: total,
      total,
      monto_recibido: total,
      cambio: 0,
      estado: 'Confirmada',
      observacion: '',
      id_cliente: clienteActivo?.id ?? null,
      id_usuario: currentUser?.id ?? 1,
      caja_session_id: activeSession.id,
      items: cart.map(c => ({ producto_id: c.producto_id, nombre: c.nombre, cantidad: c.cantidad, precio_unitario: c.precio_unitario, subtotal: c.precio_unitario * c.cantidad, costo_unitario: 0 })),
    }
    try {
      await createSale(payload)
      const p = await fetchProducts()
      setProducts(p)
      setCart([])
      alert('Venta creada')
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Error creando venta: ' + msg)
    }
  }

  const canAccess = (view: PageView) => {
    if (view === 'inicio') return true
    if (role === 'cajero') {
      return view === 'ventas' || view === 'ventas-del-dia' || view === 'arqueo' || view === 'clientes'
    }
    return true
  }

  const availablePages: PageView[] = ['inicio', 'ventas', 'ventas-del-dia', 'arqueo', 'inventario', 'clientes']
  const cartTotal = cart.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0)
  const roleConfig = role === 'admin'
    ? {
        title: 'Modo administrador',
        subtitle: 'Gestión completa de ventas, inventario, clientes y caja.',
        accent: 'from-violet-600 via-fuchsia-500 to-sky-500',
        badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
        permissions: ['Ventas', 'Caja', 'Clientes', 'Inventario'],
      }
    : {
        title: 'Modo cajero',
        subtitle: 'Atención rápida al cliente con ventas, caja y registro de clientes.',
        accent: 'from-sky-600 via-cyan-500 to-emerald-500',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
        permissions: ['Ventas', 'Caja', 'Clientes'],
      }

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [authenticated])

  useEffect(() => {
    if (!canAccess(page)) {
      setPage('inicio')
    }
  }, [page, role])

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/95 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.45)] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white sm:p-10">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold">Acceso seguro</div>
              <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Librería 4 Hermanos</h1>
              <p className="mt-3 max-w-md text-sm text-slate-300 sm:text-base">
                Ingresa con tu usuario para acceder al panel correcto según tu rol: administrador o cajero.
              </p>
              <div className="mt-8 space-y-3 rounded-[24px] border border-white/10 bg-white/10 p-4 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="font-semibold">Administrador</div>
                  <div className="mt-1 text-slate-300">admin@libreria.com / admin123</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="font-semibold">Cajero</div>
                  <div className="mt-1 text-slate-300">cajero@libreria.com / cajero123</div>
                </div>
              </div>
            </div>
            <div className="p-8 sm:p-10">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Inicio de sesión</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Bienvenido</h2>
                <p className="mt-2 text-sm text-slate-500">Ingresa tus credenciales para entrar al sistema.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Usuario</label>
                  <input
                    type="email"
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                    placeholder="correo@dominio.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {loginError && <p className="text-sm text-rose-600">{loginError}</p>}
                <button className="w-full rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Ingresar al sistema
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className={`rounded-[28px] bg-gradient-to-r ${roleConfig.accent} p-[1px]`}>
            <div className="rounded-[28px] bg-white/95 p-5 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className={`mb-3 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${roleConfig.badgeClass}`}>
                    {roleConfig.title}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Librería 4 Hermanos</h1>
                  <p className="mt-2 text-sm text-slate-600 sm:text-base">
                    {roleConfig.subtitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {roleConfig.permissions.map(permission => (
                      <span key={permission} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">Turno</div>
                    <div>{activeSession ? 'Caja abierta' : 'Sin turno activo'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                    <div className="font-semibold text-slate-900">Usuario</div>
                    <div className="text-slate-600">{role === 'admin' ? 'Administrador' : 'Cajero'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setAuthenticated(false)
                      setLoginForm({ username: '', password: '' })
                      setLoginError('')
                      setPage('inicio')
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Estado</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{activeSession ? 'Turno activo' : 'Sin turno'}</div>
            <div className="mt-1 text-sm text-slate-500">{activeSession ? 'La caja ya está preparada para vender.' : 'Abre la caja para comenzar.'}</div>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Clientes</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{clients.length}</div>
            <div className="mt-1 text-sm text-slate-500">Registrados y listos para ventas.</div>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Productos</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{products.length}</div>
            <div className="mt-1 text-sm text-slate-500">Disponibles para el catálogo del día.</div>
          </div>
        </div>

        <nav className="mb-6 flex flex-wrap gap-2">
          {availablePages.filter(canAccess).map(view => (
            <button
              key={view}
              onClick={() => setPage(view)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page === view ? (role === 'admin' ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/20' : 'bg-sky-700 text-white shadow-lg shadow-sky-700/20') : 'border border-white/80 bg-white/80 text-slate-700 hover:bg-white'}`}
            >
              {view === 'inicio' ? 'Inicio' : view === 'ventas' ? 'Ventas' : view === 'ventas-del-dia' ? 'Ventas del día' : view === 'arqueo' ? 'Arqueo caja' : view === 'clientes' ? 'Clientes' : 'Inventario'}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-8 text-center shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)]">
            <p className="text-lg font-semibold text-slate-800">Cargando sistema...</p>
            <p className="mt-2 text-sm text-slate-500">Sincronizando productos, clientes y caja.</p>
          </div>
        ) : (
          <div>
            {page === 'inicio' && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Panel principal</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {role === 'admin' ? 'Resumen de gestión' : 'Panel de ventas'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {role === 'admin'
                      ? 'Administra ventas, inventario, clientes y turno desde este punto central.'
                      : 'Atiende clientes rápido, gestiona caja, registra clientes y revisa tus ventas del día.'}
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Turno</div>
                      <div className="mt-2 text-xl font-semibold text-slate-900">{activeSession ? 'Abierto' : 'Cerrado'}</div>
                      <div className="mt-1 text-sm text-slate-500">{activeSession ? 'La caja está lista para operar.' : 'Abre la caja para comenzar.'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Clientes</div>
                      <div className="mt-2 text-xl font-semibold text-slate-900">{clients.length}</div>
                      <div className="mt-1 text-sm text-slate-500">Registrados para la operación diaria.</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Accesos rápidos</p>
                  <div className="mt-4 grid gap-3">
                    {(['ventas', 'ventas-del-dia', 'arqueo', 'clientes'] as PageView[]).filter(view => canAccess(view)).map(view => (
                      <button
                        key={view}
                        onClick={() => setPage(view)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-white"
                      >
                        <span>{view === 'ventas' ? 'Ventas' : view === 'ventas-del-dia' ? 'Ventas del día' : view === 'arqueo' ? 'Arqueo de caja' : 'Clientes'}</span>
                        <span className="text-slate-400">→</span>
                      </button>
                    ))}
                    {role === 'admin' && (
                      <button onClick={() => setPage('inventario')} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-white">
                        <span>Inventario</span>
                        <span className="text-slate-400">→</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {role === 'admin'
                      ? 'Tu rol puede gestionar inventario, caja, clientes y ventas desde un solo panel central.'
                      : 'Tu rol está enfocado en ventas rápidas, atención al cliente, arqueo y registro de clientes.'}
                  </div>
                </section>
              </div>
            )}

            {page === 'ventas' && (
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-6">
                  <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Catálogo</p>
                        <h2 className="text-xl font-semibold text-slate-900">Productos disponibles</h2>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{products.length} artículos</div>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {products.map(product => (
                        <article key={product.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-slate-900">{product.nombre}</h3>
                              <p className="mt-1 text-sm text-slate-500">{product.descripcion}</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Stock {product.stock_actual}</span>
                          </div>
                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Precio</div>
                              <div className="text-xl font-semibold text-slate-900">{formatCurrency(product.precio_venta)}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => sellOne(product.id)} className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Vender 1</button>
                              <button onClick={() => addToCart(product)} className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">Agregar</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Cliente</p>
                        <h2 className="text-xl font-semibold text-slate-900">Asignar cliente</h2>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{clients.length} registrados</div>
                    </div>
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Cliente existente</label>
                      <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                        value={selectedClientId ?? ''}
                        onChange={e => {
                          const id = Number(e.target.value)
                          setSelectedClientId(id || null)
                          setClienteActivo(clients.find(c => c.id === id) ?? null)
                        }}
                      >
                        <option value="">Seleccionar cliente</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-800">Registrar nuevo cliente</h3>
                      <div className="mt-3 grid gap-3">
                        <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                        <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                        <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Teléfono" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                        <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Dirección" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                        <button onClick={createNewClient} className="w-full rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Registrar cliente</button>
                      </div>
                    </div>
                    {clienteActivo && (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        <div className="font-semibold">Cliente seleccionado</div>
                        <div>{clienteActivo.nombre}</div>
                        <div className="text-xs text-emerald-700">{clienteActivo.email}</div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Caja</p>
                        <h2 className="text-xl font-semibold text-slate-900">Turno actual</h2>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${activeSession ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {activeSession ? 'Abierta' : 'Cerrada'}
                      </span>
                    </div>
                    {activeSession ? (
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div>Inicio: <strong className="text-slate-900">{new Date(activeSession.fecha_inicio).toLocaleString()}</strong></div>
                        <div>Fondo inicial: <strong className="text-slate-900">{formatCurrency(activeSession.fondo_inicial)}</strong></div>
                        <div>Monto esperado: <strong className="text-slate-900">{formatCurrency(activeSession.monto_esperado)}</strong></div>
                        <div>Monto actual: <strong className="text-slate-900">{formatCurrency(activeSession.monto_actual)}</strong></div>
                        <div>Diferencia: <strong className={activeSession.diferencia === 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatCurrency(activeSession.diferencia)}</strong></div>
                        <button onClick={closeCashSession} className="mt-3 w-full rounded-2xl bg-rose-600 px-3 py-2 font-semibold text-white transition hover:bg-rose-700">Cerrar caja</button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                          <div className="text-sm font-semibold text-slate-700">Monto fijo al abrir</div>
                          <div className="mt-1 text-2xl font-bold text-slate-900">Bs. 200</div>
                        </div>
                        <button onClick={openCashSession} className="w-full rounded-2xl bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700">Abrir caja</button>
                      </div>
                    )}
                  </section>

                  <section className="rounded-[28px] border border-white/70 bg-slate-900 p-5 text-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.7)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Carrito</p>
                        <h2 className="text-xl font-semibold">Resumen de venta</h2>
                      </div>
                      <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{cart.length} ítems</div>
                    </div>
                    {cart.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">Agrega productos para crear una venta.</div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {cart.map(item => (
                          <div key={item.producto_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm">
                            <div>
                              <div className="font-semibold">{item.nombre}</div>
                              <div className="text-slate-400">{item.cantidad} × {formatCurrency(item.precio_unitario)}</div>
                            </div>
                            <div className="font-semibold">{formatCurrency(item.precio_unitario * item.cantidad)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Total</span>
                        <span className="text-2xl font-semibold text-white">{formatCurrency(cartTotal)}</span>
                      </div>
                      {activeSession ? (
                        <button onClick={submitSale} className="mt-4 w-full rounded-2xl bg-sky-500 px-3 py-2 font-semibold text-white transition hover:bg-sky-400">Cobrar y registrar venta</button>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">Abre una caja antes de registrar ventas.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {page === 'ventas-del-dia' && (
              <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Operaciones</p>
                    <h2 className="text-xl font-semibold text-slate-900">Ventas del día</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{dailySales.length} ventas</div>
                </div>
                {dailySales.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">No hay ventas registradas para hoy.</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {dailySales.map(sale => (
                      <div key={sale.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <div className="font-semibold text-slate-900">Venta #{sale.numero_venta}</div>
                          <div className="text-sm text-slate-500">Hora: {new Date(sale.fecha).toLocaleTimeString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-900">{formatCurrency(sale.total ?? 0)}</div>
                          <div className="text-sm text-slate-500">Cliente: {sale.id_cliente ?? 'General'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {page === 'clientes' && (
              <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Gestión</p>
                    <h2 className="text-xl font-semibold text-slate-900">Clientes</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{clients.length} clientes</div>
                </div>
                <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">Registrar cliente</h3>
                    <div className="mt-4 grid gap-3">
                      <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                      <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                      <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Teléfono" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                      <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Dirección" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                      <button onClick={createNewClient} className="w-full rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Registrar cliente</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">Clientes registrados</h3>
                    {clients.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">No hay clientes registrados aún.</div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {clients.map(client => (
                          <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="font-semibold text-slate-900">{client.nombre}</div>
                            <div className="text-sm text-slate-500">{client.email}</div>
                            <div className="text-sm text-slate-500">{client.telefono}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {page === 'arqueo' && (
              <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Operaciones</p>
                    <h2 className="text-xl font-semibold text-slate-900">Arqueo de caja</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{activeSession ? 'Turno activo' : 'Sin turno'}</div>
                </div>
                {activeSession ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    <div>Fondo inicial: <strong className="text-slate-900">{formatCurrency(activeSession.fondo_inicial)}</strong></div>
                    <div>Monto actual: <strong className="text-slate-900">{formatCurrency(activeSession.monto_actual)}</strong></div>
                    <div>Monto esperado: <strong className="text-slate-900">{formatCurrency(activeSession.monto_esperado)}</strong></div>
                    <div>Diferencia: <strong className={activeSession.diferencia === 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatCurrency(activeSession.diferencia)}</strong></div>
                    <button onClick={closeCashSession} className="mt-4 w-full rounded-2xl bg-rose-600 px-3 py-2 font-semibold text-white transition hover:bg-rose-700">Cerrar caja</button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                    No hay caja abierta actualmente.
                    <button onClick={openCashSession} className="mt-4 w-full rounded-2xl bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700">Abrir caja con Bs. 200</button>
                  </div>
                )}
              </section>
            )}

            {page === 'inventario' && (
              <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Inventario</p>
                    <h2 className="text-xl font-semibold text-slate-900">Productos y stock</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{products.length} productos</div>
                </div>
                <div className="mt-5 grid gap-4">
                  {products.map(product => (
                    <div key={product.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{product.nombre}</div>
                          <div className="text-sm text-slate-500">{product.descripcion}</div>
                        </div>
                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Stock {product.stock_actual}</div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">Precio venta: <strong className="text-slate-900">{formatCurrency(product.precio_venta)}</strong></div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">Costo promedio: <strong className="text-slate-900">{formatCurrency(product.costo_promedio ?? 0)}</strong></div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">Stock mínimo: <strong className="text-slate-900">{product.stock_minimo}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
