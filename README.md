# Biblioteca — Programación Web Full Stack (UAI 2026)

Sistema de préstamos de una biblioteca: catálogo público de libros, préstamos para usuarios
registrados y panel de administración para el rol `ADMIN`. Sigue la misma arquitectura, tecnologías y
medidas de seguridad que el proyecto de la materia ([T-Arias/mdw-2026](https://github.com/T-Arias/mdw-2026)),
en el estado de la **Clase 9 (React Router)**.

Stack: Node.js + Express 5 + TypeScript · MongoDB + Mongoose · Zod · bcrypt + JWT en cookies `httpOnly` ·
React 19 + Vite + React Router 7 · axios · Tailwind CSS v4.

## Estructura

```
backend/    -> API Express + MongoDB (puerto 3000)
frontend/   -> React + Vite (puerto 5173)
```

Cada proyecto tiene su propio `package.json`, `node_modules` y `.env`: los comandos `npm` se corren
dentro de `backend/` o `frontend/`, no en la raíz.

## Cómo correrlo

Requisitos: Node 20.19+ / 22.12+ y un MongoDB (local o Atlas).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # completar MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET y SEED_ADMIN_*
npm run seed              # carga 10 autores y 18 libros de ejemplo y crea el usuario ADMIN
npm run dev

# 2. Frontend (otra terminal)
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api/v1
npm run dev
```

Abrir `http://localhost:5173`. Los `.env` conviene crearlos desde el editor: `echo ... > .env` en
PowerShell 5.1 los guarda en UTF-16 y ni dotenv ni Vite los leen.

`npm run seed` **borra y vuelve a cargar** autores, libros y préstamos (no toca a los usuarios). El
usuario de `SEED_ADMIN_EMAIL` se crea como ADMIN o, si ya existía, se lo promueve a ADMIN.

## Modelo de datos

| Colección | Campos principales |
|---|---|
| `users` | `name`, `email` (único), `password` (hash bcrypt), `role` (`ADMIN` \| `USER`, default `USER`) |
| `authors` | `name`, `nationality`, `birthYear`, `bio` |
| `books` | `title`, `isbn` (único), `author` (ref Author), `genre`, `publishedYear`, `synopsis`, `totalCopies`, `availableCopies`, `active` |
| `loans` | `user` (ref User), `book` (ref Book), `loanDate`, `dueDate` (+14 días), `returnedAt`, `status` (`ACTIVE` \| `RETURNED`) |

Reglas de negocio: máximo 3 préstamos activos por usuario, no se puede pedir dos veces el mismo libro,
préstamo por 14 días, "vencido" = activo con `dueDate` pasada.

## Rutas del frontend (tres niveles de acceso)

| Ruta | Acceso | Qué muestra |
|---|---|---|
| `/login`, `/register` | Pública | Formularios (pantalla completa, sin Layout) |
| `/` | — | Redirige a `/home` |
| `/home` | **Pública** | Catálogo con búsqueda, filtros (género, autor, disponibles) y paginación |
| `/books/:id` | **Pública** | Detalle del libro. Sin sesión ofrece "Ingresá para pedirlo"; con sesión, "Pedir prestado" |
| `/perfil` | **Privada** (cualquier usuario logueado) | Datos del usuario y sus préstamos, con botón "Devolver" |
| `/admin` | **Privada por rol** (`ADMIN`) | Todos los libros (activos e inactivos), con borrado |
| `/admin/prestamos` | **Privada por rol** (`ADMIN`) | Préstamos de todos los usuarios, filtro por estado, registrar devolución |
| `*` | — | 404 |

La sesión vive en `AuthProvider` (Context): al montar pregunta `GET /auth/me`, y un interceptor de axios
pone `user = null` ante cualquier 401. `<ProtectedRoute />` y `<ProtectedRoute roles={["ADMIN"]} />`
hacen de guard. **El front esconde, el back protege**: cada endpoint vuelve a validar sesión y rol.

## Endpoints (`/api/v1`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Pública | Crea un usuario (siempre `USER`) |
| POST | `/auth/login` | Pública | Setea las cookies `accessToken` y `refreshToken` |
| POST | `/auth/logout` | Pública | Borra las cookies |
| GET | `/auth/me` | Logueado | Usuario de la sesión actual |
| QUERY | `/books` | Pública | Listado con filtros en el body: `search`, `genre`, `author`, `available`, `active`, `page`, `limit`, `sortBy`, `sortOrder` |
| GET | `/books/:id` | Pública | Detalle con el autor populado |
| POST · PUT · DELETE | `/books[/:id]` | `ADMIN` | ABM de libros |
| QUERY | `/authors` | Pública | Listado de autores |
| GET | `/authors/:id` | Pública | Detalle de autor |
| POST · PUT · DELETE | `/authors[/:id]` | `ADMIN` | ABM de autores |
| POST | `/loans` | Logueado | Pedir un libro: body `{ bookId }` |
| GET | `/loans/me` | Logueado | Mis préstamos |
| PATCH | `/loans/:id/return` | Dueño del préstamo o `ADMIN` | Registrar la devolución |
| QUERY | `/loans` | `ADMIN` | Todos los préstamos, con filtros (`status`, `user`, `book`) |

Ejemplo de listado:

```bash
curl -X QUERY http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{ "genre": "Policial", "available": true, "page": 1, "limit": 12 }'
```

## Seguridad

- **Contraseñas** hasheadas con bcrypt (10 rondas de salt). Login con mensaje genérico ("Credenciales
  invalidas") para no revelar qué emails existen.
- **JWT en cookies `httpOnly`** (JS no puede leerlas → protege de XSS), `secure` en producción y
  `sameSite: "lax"` (CSRF). Access token de 15 min + refresh token de 7 días: `authMiddleware` renueva el
  access token de forma transparente cuando vence.
- **Roles**: `requireRole("ADMIN")` siempre después de `authMiddleware`. 401 = sin sesión, 403 = sin permiso.
- **Validación con Zod** en todos los bodies (`validateBody`): tipos, rangos, enums y defaults. Zod
  descarta los campos que no están en el schema, entonces:
  - nadie puede registrarse mandando `"role": "ADMIN"`;
  - nadie puede mandar `availableCopies` al crear un libro (lo calcula el backend);
  - en `POST /loans` el usuario sale del token, nunca del body.
- **Inyección NoSQL**: los filtros de Mongo se arman campo por campo desde una whitelist (nunca se
  esparce `req.body` en la query), y un body como `{ "genre": { "$ne": null } }` lo rechaza Zod con 400.
- **ReDoS**: el texto de búsqueda se escapa antes de usarlo en `$regex`.
- **Ids**: `isValidObjectId` / regex de ObjectId → 400 en vez de un CastError 500.
- **Autorización por dueño**: un USER que intenta devolver un préstamo ajeno recibe 404 (no se confirma
  que exista).
- **Concurrencia**: el préstamo descuenta el ejemplar con un `findOneAndUpdate` atómico
  (`availableCopies > 0`), así dos pedidos simultáneos no se llevan el último ejemplar; la devolución pasa
  de `ACTIVE` a `RETURNED` también de forma atómica (no se puede devolver dos veces).
- **Integridad referencial**: no se puede borrar un libro con préstamos activos ni un autor con libros
  (409), ni bajar `totalCopies` por debajo de los ejemplares prestados.
- **CORS** restringido a `CORS_ORIGIN`, con `credentials: true` y el método `QUERY` habilitado.

### Diferencias con el proyecto de la cátedra

- En el repo de la materia, `POST/PUT /students` y todo el CRUD de `subjects` quedaron sin
  autenticación, y `DELETE /students/:id` usa `requireRole` sin `authMiddleware` antes (siempre da 401).
  Acá la lectura es pública y toda escritura exige `authMiddleware` + `requireRole("ADMIN")`.
- La firma de tokens y las opciones de las cookies están en un solo lugar (`utils/tokens.ts`) en vez de
  duplicadas en el controller y el middleware; `logout` borra las cookies con las mismas opciones con
  las que se crearon.
- `npm run seed` reemplaza el paso manual de promover un usuario a ADMIN desde la base.

## Próximas clases

- **Clase 10**: formularios de alta/edición de libros y autores en `/admin` con React Hook Form + Zod
  (la API ya tiene `POST`/`PUT /books` y `/authors`).
- **Clase 11**: Redux Toolkit + RTK Query para la sesión y el catálogo.
- **Clases 13–14**: endpoint `/chat` con LangChain y RAG sobre las sinopsis y biografías
  ("recomendame un policial", "¿qué tiene Borges?").
- **Clase 15**: deploy (Vercel + Render/Railway), `NODE_ENV=production` y `CORS_ORIGIN` del dominio real.
