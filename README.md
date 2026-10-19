# Gogogo Market — TPO APIs (Frontend)

Frontend del **Marketplace** del TPO de Aplicaciones Interactivas (UADE). Es una tienda online de **figuras de anime** con estética de manga/cómic, hecha en **React + Vite**, que consume la API REST del backend en Spring Boot.

> ゴゴゴ — *"Llevate tu figura de anime"*

---

## Tecnologías

| Herramienta | Uso |
|---|---|
| [React 19](https://react.dev/) | Librería de UI |
| [Vite 8](https://vite.dev/) | Servidor de desarrollo y build |
| [React Router 7](https://reactrouter.com/) | Navegación entre vistas (`react-router-dom`) |
| [Tailwind CSS 3](https://tailwindcss.com/) + [daisyUI 5](https://daisyui.com/) | Utilidades de estilo y componentes base |
| CSS por componente | Estilos propios de cada componente (`*.css`) |
| ESLint | Linter (reglas de React Hooks y React Refresh) |

---

## Requisitos previos

- **Node.js** 20.19+ o 22.12+ (lo pide Vite 8)
- **npm**
- El **backend del Marketplace** corriendo en `http://localhost:8080`

---

## Instalación y ejecución

El proyecto de React está dentro de la carpeta `marketplace/`.

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd TPO-APIS-FRONTEND/marketplace

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev
```

La app queda disponible en **http://localhost:5173**.

> ⚠️ Antes de abrir la app, levantá el backend. Si no está activo, el catálogo y el detalle muestran un mensaje de error.

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Corre ESLint sobre el proyecto |

---

## Estructura del proyecto

```
marketplace/
├── index.html              # HTML base (título "Gogogo Market" y favicon)
├── public/
│   └── Logo.jpg            # Logo / favicon
├── src/
│   ├── main.jsx            # Punto de entrada: monta <App /> dentro de <BrowserRouter>
│   ├── App.jsx             # Navbar + definición de rutas
│   ├── index.css           # Directivas de Tailwind
│   ├── views/              # Páginas (una por ruta)
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── Product.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── components/         # Componentes reutilizables (cada uno con su .css)
│   │   ├── Navbar.jsx
│   │   ├── HomeBanner.jsx
│   │   ├── Catalog.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   └── assets/
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── eslint.config.js
```

**Criterio de organización:** las *views* son páginas finitas que solo envuelven a un componente; la lógica (estado, `fetch`, validaciones) vive en los *components*.

---

## Rutas

| Ruta | Vista | Descripción |
|---|---|---|
| `/` y `/home` | `Home` | Banner principal con un producto destacado |
| `/products` | `Products` | Catálogo con búsqueda, orden y paginación |
| `/products/:id` | `Product` | Detalle de una figura |
| `/login` | `Login` | Inicio de sesión |
| `/register` | `Register` | Registro de cuenta (comprador o vendedor) |

---

## Funcionalidades

### Navbar
Logo de Gogogo Market, buscador, links a *Productos*, *Cómo comprar* y *Contacto*, botón **Ingresar / Cerrar sesión** según haya token, y botón de carrito con contador.

### Home
Banner estilo cómic (fondo de tramado, espiral de cuaderno, globo de texto "¡La quiero!") con botones a *Ver figuras* y *Cómo comprar*. A la derecha muestra la imagen del primer producto de la base, o una silueta si no hay imagen.

### Catálogo (`Catalog`)
- Trae los productos **paginados** desde el backend (12 por página; la página arranca en 0, como en Spring).
- **Buscador** por nombre/personaje: se envía con Enter o con el botón y vuelve a la primera página.
- **Orden por precio** (menor a mayor / mayor a menor), aplicado sobre la página actual.
- Mensajes de estado: cargando, error de servidor y sin resultados.

### Tarjeta de producto (`ProductCard`)
Imagen (o placeholder ゴ), categoría, nombre, precio en **pesos argentinos** (`$ 159.900`), precio original tachado si hay descuento, y etiquetas de **descuento** y **Agotada**. La imagen y el nombre llevan al detalle.

### Detalle de producto (`ProductDetail`)
Galería con imagen principal y miniaturas (si hay más de una imagen), categoría, precio con descuento, stock disponible, descripción y vendedor.

### Login y registro
- **Login** con email *o* nombre de usuario y contraseña.
- **Registro** con usuario, nombre, apellido, email, contraseña (con confirmación validada en el front) y tipo de cuenta **BUYER** o **SELLER**. Si el usuario o el email ya existen, se muestra un error específico.
- Ambos reciben un `accessToken` (JWT) del backend y redirigen al catálogo.

---

## Integración con el backend

La URL base está definida como constante en cada componente:

```js
const URL = 'http://localhost:8080';
```

Endpoints que consume el frontend:

| Método | Endpoint | Usado en | Respuesta esperada |
|---|---|---|---|
| `GET` | `/products?page={n}&size={n}&keyword={texto}` | `Catalog`, `HomeBanner` | Página de Spring (`content`, `totalPages`) |
| `GET` | `/products/{id}` | `ProductDetail` | Producto |
| `GET` | `/images/view/{imageId}` | `ProductCard`, `ProductDetail`, `HomeBanner` | Imagen |
| `POST` | `/api/v1/auth/login` | `LoginForm` | `{ accessToken }` |
| `POST` | `/api/v1/auth/register` | `RegisterForm` | `{ accessToken }` |

**Campos del producto que usa la UI:** `id`, `name`, `description`, `price`, `finalPrice`, `discountPercentage`, `stock`, `categoryName`, `sellerUsername`, `imageIds`.

**Body de login:**
```json
{ "email": "usuario-o-email", "password": "..." }
```

**Body de registro:**
```json
{
  "username": "...",
  "name": "...",
  "surname": "...",
  "email": "...",
  "password": "...",
  "role": "BUYER"
}
```

> El backend tiene que permitir **CORS** desde `http://localhost:5173` para que el navegador acepte las respuestas.

---

## Estado actual y pendientes

- [ ] **Sesión / token:** `App.jsx` pasa `onLogin={login}` a Login y Register, pero la función `login` (y el estado del token) todavía no está definida. Falta definir dónde guardar el token y pasarle `token` y `onLogout` al `Navbar`.
- [ ] **Carrito:** la ruta `/cart` no existe y el contador del Navbar está hardcodeado.
- [ ] **Agregar al carrito:** `ProductCard` y `ProductDetail` ya soportan un `onAdd`, pero ningún padre se lo pasa todavía.
- [ ] **Páginas faltantes:** `/how-to-buy` y `/contact`.
- [ ] **Buscador del Navbar:** es visual, todavía no filtra (el que funciona es el del catálogo).
- [ ] **Banner del Home:** guarda la página completa en vez del primer producto (`data.content[0]`), por eso siempre muestra la silueta.
- [ ] **URL del backend:** centralizarla (por ejemplo con una variable de entorno `VITE_API_URL`) en lugar de repetirla en cada componente.
