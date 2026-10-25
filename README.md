# Gogogo Market — TPO APIs (Frontend)

Frontend del **Marketplace** del TPO de Aplicaciones Interactivas (UADE). Es una tienda online de **figuras de anime** con estética de manga, hecha en **React + Vite**, que consume la API REST del backend en Spring Boot.

> ゴゴゴ — *"Llevate tu figura de anime"*

---

## Tecnologías

| Herramienta | Uso |
|---|---|
| [React 19](https://react.dev/) | Librería de UI |
| [Vite 8](https://vite.dev/) | Servidor de desarrollo |
| [React Router 7](https://reactrouter.com/) | Navegación entre vistas (`react-router-dom`) |
| [Tailwind CSS 3](https://tailwindcss.com/) + [daisyUI 5](https://daisyui.com/) | Utilidades de estilo y componentes base |
| CSS por componente | Estilos propios de cada componente (`*.css`) |
| ESLint | Linter (reglas de React Hooks y React Refresh) |

---

## Requisitos previos

- **Node.js** 20.19+ o 22.12+ (lo pide Vite 8)
- **npm**
- El **backend del Marketplace** corriendo en `http://localhost:8080` (ver [Qué necesita el backend](#qué-necesita-el-backend))

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

> ⚠️ Antes de abrir la app, levantá el backend. Si no está activo, el catálogo y el detalle muestran un mensaje de error en español.

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con recarga en caliente |
| `npm run lint` | Corre ESLint sobre el proyecto |

> **Sobre el build de producción:** no forma parte de lo que se evalúa en este proyecto, y `npm run build` falla por una incompatibilidad entre las versiones de daisyUI (5) y Tailwind (3) que trae el proyecto. Si hiciera falta generarlo, se puede con `npx vite build --minify false`.

---

## Estructura del proyecto

```
marketplace/
├── index.html              # HTML base (título "Gogogo Market" y favicon)
├── public/
│   └── Logo.jpg            # Logo / favicon
├── src/
│   ├── main.jsx            # Punto de entrada: monta <App /> dentro de <BrowserRouter>
│   ├── App.jsx             # Navbar + definición de rutas (usa el hook useLoginToken)
│   ├── index.css           # Directivas de Tailwind
│   ├── views/              # Páginas (una por ruta); solo envuelven a un componente
│   │   ├── Home.jsx · Products.jsx · Product.jsx
│   │   ├── Login.jsx · Register.jsx · Profile.jsx
│   │   ├── Sell.jsx · Admin.jsx
│   │   └── HowToBuy.jsx · Contact.jsx · NotFound.jsx
│   ├── components/         # Componentes (cada uno con su .css)
│   │   ├── UseLoginToken.jsx   # Hook que guarda el token (estado + localStorage)
│   │   ├── Navbar.jsx · HomeBanner.jsx
│   │   ├── Catalog.jsx · ProductCard.jsx · ProductDetail.jsx
│   │   ├── CartModal.jsx       # Carrito y checkout en 3 pasos
│   │   ├── LoginForm.jsx · RegisterForm.jsx · UserProfile.jsx
│   │   ├── SellerPanel.jsx     # Panel del vendedor
│   │   ├── AdminUsers.jsx      # Gestión de usuarios y permisos
│   │   └── HowToBuyContent.jsx · ContactSection.jsx · NotFound.jsx
│   └── assets/
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── eslint.config.js
```

**Criterio de organización:** las *views* son páginas finitas que solo envuelven a un componente; la lógica (estado, `fetch`, validaciones) vive en los *components*.

---

## Rutas

| Ruta | Vista | Quién la ve | Descripción |
|---|---|---|---|
| `/` y `/home` | `Home` | Todos | Banner principal con un producto destacado |
| `/products` | `Products` | Todos | Catálogo con búsqueda, filtros, orden y paginación |
| `/products/:id` | `Product` | Todos | Detalle de una figura |
| `/login` | `Login` | Todos | Inicio de sesión |
| `/register` | `Register` | Todos | Registro de cuenta (comprador o vendedor) |
| `/profile` | `Profile` | Con sesión | Datos de la cuenta e historial de compras |
| `/sell` | `Sell` | Vendedores y administradores | Panel para publicar y gestionar figuras |
| `/admin` | `Admin` | Administradores | Gestión de usuarios y permisos |
| `/how-to-buy` | `HowToBuy` | Todos | Guía de compra |
| `/contact` | `Contact` | Todos | Formulario de contacto (local, no llama al backend) |
| cualquier otra | `NotFound` | Todos | Página 404 |

Las rutas que exigen sesión (`/profile`, `/sell`, `/admin`) redirigen a `/login` si no hay token.

---

## Roles y permisos

| Rol | Puede |
|---|---|
| **Visitante** | Ver el catálogo y los detalles, buscar y filtrar |
| **Comprador** (`BUYER`) | Lo anterior + carrito, compras y perfil |
| **Vendedor** (`SELLER`) | Lo de comprador + publicar y gestionar sus figuras |
| **Administrador** (`ADMIN`) | Lo de vendedor + crear categorías y cambiar el rol de los usuarios |

El menú muestra **Vender** solo a vendedores y administradores, y **Admin** solo a administradores. Los permisos los asigna el administrador desde `/admin`.

---

## Funcionalidades

### Gestión de usuarios
- **Registro** con usuario, nombre, apellido, email, contraseña (con confirmación validada en el front) y tipo de cuenta **Comprador** o **Vendedor**.
- **Login** con email *o* nombre de usuario y contraseña. El token (JWT) se guarda en `localStorage` (`jwtToken`) mediante el hook `useLoginToken`.
- **Perfil:** el usuario ve y edita sus datos, y consulta su historial de compras.
- **Administración** (`/admin`): el administrador ve todos los usuarios y cambia su rol. Su propia cuenta aparece bloqueada para no quedarse sin acceso.

### Catálogo (`Catalog`)
- Productos **paginados** desde el backend (12 por página).
- **Búsqueda** por nombre, **filtro por categoría** (disponible también sin iniciar sesión) y **rango de precio** (se compara con el precio sin descuento). Se aplican juntos con el botón *Buscar* o Enter, y *Limpiar* los borra.
- **Orden por precio** sobre la página actual; las figuras agotadas quedan al final.
- Cada tarjeta muestra imagen, categoría, nombre, precio en pesos argentinos, descuento (con el precio original tachado), etiqueta **Agotada** y cuántas unidades hay de esa figura en tu carrito.

### Detalle de producto (`ProductDetail`)
Galería con miniaturas, categoría, precio con descuento, stock, descripción y vendedor. Selector de cantidad limitado por el stock. Si la figura está agotada, queda indicado y no se puede agregar.

### Carrito y compra (`CartModal`)
- Agregar desde el catálogo o el detalle (sin sesión lleva al login).
- En el carrito: sumar, restar y quitar productos, con el **total calculado automáticamente**.
- **Checkout en 3 pasos** (Carrito → Tus datos → Listo): se elige medio de pago y forma de entrega. El backend valida el stock, lo descuenta y devuelve la orden.

### Panel del vendedor (`SellerPanel`)
- **Publicar** una figura con nombre, categoría, precio, stock, descuento, descripción y **una o más fotos** (hay que elegirlas juntas en la misma ventana con Ctrl o Shift).
- **Modificar** nombre, descripción, precio, stock y descuento de cada publicación.
- **Eliminar** una publicación (baja lógica) y **volver a publicarla** desde la sección plegable *Publicaciones eliminadas*.
- El administrador además puede **crear categorías**.

### Otras pantallas
Banner del Home con el primer producto, *Cómo comprar*, *Contacto* y una página **404**.

---

## Integración con el backend

La URL base está definida como constante en cada componente:

```js
const URL = 'http://localhost:8080';
```

Si cambia, se reemplaza `http://localhost:8080` en todo el proyecto con buscar y reemplazar.

Endpoints que consume el frontend:

| Método | Endpoint | Para qué |
|---|---|---|
| `POST` | `/api/v1/auth/login` · `/api/v1/auth/register` | Iniciar sesión y registrarse (devuelven `accessToken`) |
| `GET` | `/products` (con `page`, `size`, `keyword`, `categoryId`, `minPrice`, `maxPrice`) | Catálogo paginado y filtrado |
| `GET` | `/products/{id}` | Detalle de una figura |
| `GET` | `/products/seller` | Publicaciones del vendedor (incluye las eliminadas) |
| `POST` · `PATCH` · `PUT` | `/products` · `/products/{id}` | Publicar, modificar, eliminar y volver a publicar |
| `POST` | `/images` | Subir una foto de un producto |
| `GET` | `/images/view/{id}` | Ver una imagen |
| `GET` · `POST` | `/categories` | Listar categorías (público) y crearlas (administrador) |
| `GET` | `/carts` | Carrito del usuario |
| `POST` · `DELETE` | `/cartItems` · `/cartItems/product/{id}` · `/cartItems/product/one/{id}` | Agregar, quitar y restar unidades |
| `POST` · `GET` | `/orders/checkout` · `/orders` | Comprar y ver el historial |
| `GET` · `PATCH` | `/users` · `/users/{id}` | Listar usuarios, editar el perfil y cambiar roles |

Todas las solicitudes que no son `GET` arman sus opciones en una constante `options` (`method`, `headers` con `Content-Type` y `Authorization: Bearer <token>`, y `body` con `JSON.stringify`).

### Manejo de errores
Cada pantalla guarda el error en un estado (arranca en `null`) y lo muestra en pantalla. El mensaje sale, en este orden, de:
1. el campo `message` que manda el backend;
2. un texto propio de esa acción, si el backend no manda ninguno (por ejemplo, un 403 sin cuerpo);
3. un aviso general en español si el servidor no responde.

---

## Qué necesita el backend

- **CORS** permitido desde `http://localhost:5173`.
- **`GET /categories` público** (sin sesión), para que el catálogo se pueda filtrar por categoría sin iniciar sesión. Crear, modificar y borrar categorías sigue siendo solo del administrador.
- **`spring.web.error.include-message=always`** en el `application.properties`, para que el front muestre los mensajes de error del backend.
- **Límite de archivos:** `spring.servlet.multipart.max-file-size=10MB` y `spring.servlet.multipart.max-request-size=30MB`, para poder subir fotos de más de 1 MB.
- **La base `marketplace` creada** en MySQL antes de arrancar, y `spring.jpa.hibernate.ddl-auto=update` para conservar los datos entre reinicios.

---

## Decisiones y limitaciones conocidas

- **Eliminar una publicación es una baja lógica:** la figura se desactiva, sale del catálogo y de los carritos, pero se conserva para no romper el historial de compras. Su nombre queda ocupado. El vendedor puede volver a publicarla desde *Publicaciones eliminadas*.
- **Sesión vencida:** el token dura 24 horas. Si vence y el usuario intenta una acción que la requiere, Spring Security responde "Access Denied" en inglés. Se soluciona volviendo a iniciar sesión.
- **Fotos de un producto:** se suben todas juntas, por lo que el orden en que quedan guardadas puede variar. La primera guardada es la que se ve en el catálogo.
- **Nombres de figuras:** el backend rechaza un nombre que ya usa otra figura (incluidas las eliminadas). El panel avisa antes si coincide con otra de tus figuras.
- **URL del backend:** se mantiene como constante en cada componente, igual que en la clase.
