# Librería 4 Hermanos — Guía de instalación y puesta en marcha

Esta guía explica cómo instalar, ejecutar y probar la aplicación (frontend + API) en un entorno de desarrollo local (Windows) con MySQL.

Requisitos
- Node.js 18+ y npm
- MySQL Server 8+
- Git (opcional)

Pasos rápidos
1. Instalar dependencias (raíz del proyecto):

```bash
npm install
```

2. Crear la base de datos MySQL:

```bash
mysql -u root -p0000 < server/schema-mysql.sql
```

3. Iniciar el servidor API (Express + MySQL):

```bash
npm run start:server
```

El servidor escucha por defecto en `http://localhost:4000` y se conecta a la base de datos `libreria4hermanos` con el usuario `root` y la contraseña `0000`.

4. Iniciar la aplicación frontend (Vite):

```bash
npm run dev
```

El frontend se sirve por defecto en `http://localhost:8443` con esta configuración, y también puedes usar `npm run start:client`.
La aplicación frontend usa `VITE_API_BASE` para apuntar a la API; por defecto busca `http://localhost:4000`.

Inicio de sesión
- Administrador:
  - `admin@libreria.com`
  - `admin123`
- Cajero:
  - `cajero@libreria.com`
  - `cajero123`

La API de autenticación está disponible en `POST /api/auth/login`.

Base de datos
- La base de datos utilizada es MySQL y se llama `libreria4hermanos`.
- El servidor crea tablas básicas y semillas iniciales para productos, usuarios y proveedores si aún no existen.

Endpoints relevantes
- `GET /api/products` — Listar productos
- `POST /api/products` — Crear producto (payload: `nombre`, `precio_venta`, `stock_actual`, ...)
- `POST /api/products/:id/decrement` — Decrementar stock (payload: `{ qty }`)
- `POST /api/sales` — Crear venta (payload: sale con `items`)
- `GET /api/moves` — Listar movimientos de inventario
- `GET /api/sessions` — Listar sesiones de caja
- `POST /api/sessions` — Abrir nueva sesión (payload: `id_usuario`, ...)
- `POST /api/sessions/:id/close` — Cerrar sesión de caja (payload: `{ diferencia }`)
- `GET /api/clients` — Listar clientes
- `POST /api/clients` — Crear cliente
- `GET /api/categories` — Listar categorías
- `POST /api/categories` — Crear categoría
- `GET /api/users` — Listar usuarios
- `POST /api/users` — Crear usuario
- `POST /api/auth/login` — Autenticación de usuario (payload: `{ email, password }`)

Notas y recomendaciones
- La base de datos es un archivo SQLite en `server/data.db`. Haz backup si vas a hacer pruebas destructivas.
- La API inicializa tablas y realiza seed de algunos productos si la tabla `products` está vacía.
- Si cambias `VITE_API_BASE`, crea un archivo `.env` con `VITE_API_BASE=http://tu-api:4000` antes de arrancar Vite.

Comandos útiles
- Instalar dependencias: `npm install`
- Arrancar API: `npm run start:server`
- Arrancar frontend: `npm run dev`
- Instalar dependencias del subdirectorio server (si lo prefieres): `cd server && npm install` (no necesario si instalas desde la raíz)

Problemas comunes
- Error al abrir la DB: verifica que MySQL esté activo y que las credenciales `root/0000` sean correctas.
- Puertos en uso: cambia el puerto de Vite o la variable `PORT` antes de arrancar.

Soporte
Si quieres, puedo:
- Añadir ejemplos concretos de payloads para cada endpoint.
- Preparar una colección Postman/Insomnia con las llamadas.
- Añadir un script para resetear la base de datos para pruebas.

---
Guía generada automáticamente por el asistente de desarrollo.
