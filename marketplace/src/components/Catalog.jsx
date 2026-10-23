import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import './Catalog.css';

// URL base del backend
const URL = 'http://localhost:8080';
// Cantidad de productos que se piden al backend por página
const PAGE_SIZE = 12;
// Filtros sin ningún valor (así arranca el catálogo)
const EMPTY_FILTERS = { keyword: '', categoryId: '', minPrice: '', maxPrice: '' };

// Compara dos conjuntos de filtros campo por campo
const sameFilters = (a, b) => {
    return a.keyword === b.keyword && a.categoryId === b.categoryId && a.minPrice === b.minPrice && a.maxPrice === b.maxPrice;
};

const Catalog = ({ token }) => {
    // Ítems actuales del carrito para mostrar la cantidad en cada ProductCard
    const [cartItems, setCartItems] = useState([]);
    // Productos de la página actual que devuelve el backend
    const [products, setProducts] = useState([]);
    // Número de página (el backend empieza a contar desde 0)
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    // Mientras es true se muestra "Cargando figuras..."
    const [loading, setLoading] = useState(true);
    // Mensaje de error si falla la carga (null si no hay ninguno)
    const [error, setError] = useState(null);
    // Mensaje de error al agregar al carrito, por ejemplo sin stock (null si no hay ninguno)
    const [cartError, setCartError] = useState(null);
    // Categorías para el selector (solo se piden con la sesión iniciada)
    const [categories, setCategories] = useState([]);
    // Lo que se va escribiendo o eligiendo en el formulario de filtros
    const [search, setSearch] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [minPriceInput, setMinPriceInput] = useState('');
    const [maxPriceInput, setMaxPriceInput] = useState('');
    // Filtros ya enviados al backend (se actualizan recién al buscar)
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    // Mensaje si los filtros no son válidos (por ejemplo, mínimo mayor al máximo)
    const [filterError, setFilterError] = useState(null);
    // Orden elegido: default, asc o desc
    const [sort, setSort] = useState('default');
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Escucha si la Navbar nos manda una palabra para buscar
    useEffect(() => {
    if (location.state?.searchKeyword) {
        const word = location.state.searchKeyword;
        setSearch(word);
        setFilters((prev) => ({ ...prev, keyword: word }));
        setPage(0);
        navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.updatedCart) {
        setCartItems(location.state.updatedCart.items || []);
    }
}, [location.state, navigate, location.pathname]);

    // Pedimos las categorías para el selector cada vez que cambia la sesión
    useEffect(()=>{
        // Sin sesión no se pide nada: el backend solo lista las categorías con el token
        if (!token) {
            return;
        }
        fetch(`${URL}/categories`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response)=> response.json())
        .then((data)=>{
            // Si no vienen las categorías (por ejemplo, token vencido) saltamos al catch
            if (!data.content) {
                throw new Error("La respuesta del servidor no es válida");
            }
            setCategories(data.content);
        })
        .catch((error)=>{
            // Si falla, el catálogo sigue funcionando: solo no aparece el selector
            console.error("Error al cargar las categorias: ", error);
        });
    }, [token]);

    // Hacemos el GET al backend cada vez que cambia la página, los filtros o la sesión
    useEffect(()=>{
        // Armamos la URL con la paginación y los filtros que tengan valor
        let url = `${URL}/products?page=${page}&size=${PAGE_SIZE}`;
        if (filters.keyword) {
            // encodeURIComponent evita que espacios o símbolos rompan la URL
            url += `&keyword=${encodeURIComponent(filters.keyword)}`;
        }
        // La categoría solo cuenta con la sesión iniciada, que es cuando se puede elegir
        if (filters.categoryId && token) {
            url += `&categoryId=${filters.categoryId}`;
        }
        if (filters.minPrice !== '') {
            url += `&minPrice=${filters.minPrice}`;
        }
        if (filters.maxPrice !== '') {
            url += `&maxPrice=${filters.maxPrice}`;
        }
        fetch(url)
        .then((response)=> response.json())
        .then((data)=>{
            // Si no vienen los productos (por ejemplo, un error del servidor) lanzamos el mensaje que mandó el backend
            if (!data.content) {
                throw new Error(data.message || 'No pudimos cargar las figuras.');
            }
            // El backend devuelve una página de Spring: los productos vienen en data.content
            setProducts(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        })
        .catch((error)=>{
            console.error("Error al cargar el catalogo: ", error);
            // Si el error lo lanzamos nosotros (trae el mensaje del backend) lo mostramos; si no (servidor caído), uno general
            setError(error.name === 'Error' ? error.message : 'No pudimos cargar las figuras. Revisá que el servidor esté activo e intentá de nuevo.');
        })
        // finally se ejecuta siempre, haya salido bien o mal
        .finally(()=> setLoading(false));
    }, [page, filters, token]); // Se vuelve a ejecutar solo si cambia alguno de estos tres
    
    // Ordenamos por precio solo los productos de la página actual
    // Sin orden elegido se muestran como los manda el backend
    //los productos sin stock iran atras de todo
    let visibleProducts = [...products];

    visibleProducts.sort((a,b) =>{
    const aAgotada = a.stock === 0;
    const bAgotada = b.stock === 0;
    //Si 'a' está agotada y 'b' no, mandamos 'a' al final
    if (aAgotada && !bAgotada) return 1;
    //Si 'b' está agotada y 'a' no, mandamos 'a' al final
    if (bAgotada && !aAgotada) return -1;
    //si ambas estan en el mismo estado de stock, ordenamos segun sort
    if (sort === 'asc'){
        return a.finalPrice - b.finalPrice;
    } else if (sort === 'desc'){
        return b.finalPrice - a.finalPrice
    }

    // Si el sort es 'default', no cambiamos el orden entre ellos
    return 0;


})
    // Es true si hay algún filtro aplicado
    const hasFilters = !sameFilters(filters, EMPTY_FILTERS);
    
    // Se ejecuta al buscar (con Enter o con el botón)
    const handleSearch = (e) => {
        // Evita que el formulario recargue la página
        e.preventDefault();
        // Si el precio mínimo es mayor al máximo, avisamos y no pedimos nada
        if (minPriceInput !== '' && maxPriceInput !== '' && Number(minPriceInput) > Number(maxPriceInput)) {
            setFilterError('El precio mínimo no puede ser mayor al máximo.');
            return;
        }
        setFilterError(null);
        const newFilters = {
            keyword: search.trim(),
            categoryId: categoryInput,
            minPrice: minPriceInput,
            maxPrice: maxPriceInput
        };
        // Si son los mismos filtros y ya estamos en la primera página, no hay nada que pedir
        if (sameFilters(newFilters, filters) && page === 0) {
            return;
        }
        setLoading(true);
        // Toda búsqueda nueva arranca desde la primera página
        setPage(0);
        setFilters(newFilters);
    };

    // Borra todos los filtros y vuelve a mostrar el catálogo completo
    const clearFilters = () => {
        setSearch('');
        setCategoryInput('');
        setMinPriceInput('');
        setMaxPriceInput('');
        setFilterError(null);
        // Si ya estaba sin filtros y en la primera página, no hay nada que pedir
        if (!hasFilters && page === 0) {
            return;
        }
        setLoading(true);
        setPage(0);
        setFilters(EMPTY_FILTERS);
    };

    // Cambia de página y sube al inicio de la pantalla
    const changePage = (newPage) => {
        setLoading(true);
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddToCart = (product) => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            navigate('/login');
            return;
        }
        setCartError(null);

        // Guardamos la imagen del producto para mostrar la miniatura en el modal
        if (product.imageIds && product.imageIds.length > 0) {
            const savedImages = JSON.parse(localStorage.getItem('cartImages') || '{}');
            savedImages[product.id] = product.imageIds[0];
            localStorage.setItem('cartImages', JSON.stringify(savedImages));
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId: product.id, quantity: 1 })
        };
        fetch(`${URL}/cartItems`, options)
        .then((response) => response.json())
        .then((updatedCart) => {
            if (updatedCart && updatedCart.items) {
                // Enviamos el carrito devuelto por el POST a la Navbar y abrimos el modal
                navigate(location.pathname, {
                    replace: true,
                    state: { updatedCart, timestamp: Date.now() }
                });
            } else {
                // El backend no pudo agregar la figura (por ejemplo, sin stock): lanzamos su mensaje
                throw new Error((updatedCart && updatedCart.message) || 'No pudimos agregar la figura al carrito.');
            }
        })
        .catch((error) => {
            console.error("Error al agregar al carrito: ", error);
            setCartError(error.name === 'Error' ? error.message : 'No pudimos agregar la figura. Revisá que el servidor esté activo y que tu sesión siga iniciada.');
        });
    };
    
    useEffect(() => {
    if (!token) {
        setCartItems([]);
        return;
    }
    fetch(`${URL}/carts`, { headers: { Authorization: `Bearer ${token}` } })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
        if (data && data.items) setCartItems(data.items);
    })
    .catch((err) => console.error("Error al obtener carrito en catálogo: ", err));
}, [token]);

    return (
        <section className="catalog-wrapper">
            <div className="catalog-container">

                {/* 1. Título */}
                <h2 className="catalog-title">Figuras en venta</h2>

                {/* 2. Filtros (Buscador, categoría, precio y orden) */}
                <div className="catalog-filters">
                    {/* Formulario de filtros: se envía con Enter o con el botón */}
                    <form className="catalog-search" onSubmit={handleSearch}>
                        <input
                            type="search"
                            className="catalog-field catalog-search-input"
                            placeholder="Buscar personaje o figura..."
                            aria-label="Buscar figuras"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {/* Categoría: solo aparece con sesión iniciada (el backend pide el token para listarlas) */}
                        {token && categories.length > 0 && (
                            <select
                                className="catalog-field"
                                aria-label="Filtrar por categoría"
                                value={categoryInput}
                                onChange={(e) => setCategoryInput(e.target.value)}
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.description}</option>
                                ))}
                            </select>
                        )}
                        {/* Rango de precio: se compara con el precio sin descuento */}
                        <input
                            type="number"
                            min="0"
                            step="1"
                            className="catalog-field"
                            placeholder="Precio mín."
                            aria-label="Precio mínimo"
                            title="Se compara con el precio sin descuento"
                            value={minPriceInput}
                            onChange={(e) => setMinPriceInput(e.target.value)}
                        />
                        <input
                            type="number"
                            min="0"
                            step="1"
                            className="catalog-field"
                            placeholder="Precio máx."
                            aria-label="Precio máximo"
                            title="Se compara con el precio sin descuento"
                            value={maxPriceInput}
                            onChange={(e) => setMaxPriceInput(e.target.value)}
                        />
                        <button type="submit" className="catalog-page-btn">Buscar</button>
                        {/* El botón de limpiar solo aparece si hay filtros aplicados */}
                        {hasFilters && (
                            <button type="button" className="catalog-page-btn catalog-clear-btn" onClick={clearFilters}>Limpiar</button>
                        )}
                    </form>
                    {/* Selector de orden por precio */}
                    <select
                        className="catalog-field"
                        aria-label="Ordenar figuras"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="default">Destacadas</option>
                        <option value="asc">Precio: menor a mayor</option>
                        <option value="desc">Precio: mayor a menor</option>
                    </select>
                </div>

                {filterError && <p className="catalog-filter-error" role="alert">{filterError}</p>}

                {/* 3. Mensajes de estado (cargando, error y sin resultados) */}
                {loading && <p className="catalog-message">Cargando figuras...</p>}
                {!loading && error && <p className="catalog-message">{error}</p>}
                {!loading && !error && visibleProducts.length === 0 && (
                    <p className="catalog-message">
                        {hasFilters ? 'No hay figuras que coincidan con tu búsqueda.' : 'Todavía no hay figuras cargadas.'}
                    </p>
                )}

                {/* Error al agregar al carrito (por ejemplo, sin stock): es el mensaje que manda el backend */}
                {cartError && <p className="catalog-message" role="alert">{cartError}</p>}

                {/* 4. Grilla de productos (una tarjeta por figura) */}
                {!loading && !error && visibleProducts.length > 0 && (
                    <div className="catalog-grid">
                        {visibleProducts.map((product) => {
                            const productId = product.id ?? product.id_product;
                            const foundInCart = cartItems.find((item) => item.productId === productId);
                            const cartQuantity = foundInCart ? foundInCart.quantity : 0;

                            return (
                                <ProductCard
                                    key={productId}
                                    product={product}
                                    onAdd={handleAddToCart}
                                    cartQuantity={cartQuantity}
                                />
                            );
                        })}
                    </div>
                )}

                {/* 5. Paginación (solo aparece si hay más de una página) */}
                {!error && totalPages > 1 && (
                    <nav className="catalog-pagination" aria-label="Paginación del catálogo">
                        <button type="button" className="catalog-page-btn" disabled={page === 0 || loading} onClick={() => changePage(page - 1)}>
                            Anterior
                        </button>
                        <span className="catalog-page-info">Página {page + 1} de {totalPages}</span>
                        <button type="button" className="catalog-page-btn" disabled={page >= totalPages - 1 || loading} onClick={() => changePage(page + 1)}>
                            Siguiente
                        </button>
                    </nav>
                )}
            </div>
        </section>
    );
};

export default Catalog;
