import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import './Catalog.css';

// URL base del backend
const URL = 'http://localhost:8080';
// Cantidad de productos que se piden al backend por página
const PAGE_SIZE = 12;

const Catalog = () => {
    // Productos de la página actual que devuelve el backend
    const [products, setProducts] = useState([]);
    // Número de página (el backend empieza a contar desde 0)
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    // Mientras es true se muestra "Cargando figuras..."
    const [loading, setLoading] = useState(true);
    // Pasa a true si falla la carga
    const [error, setError] = useState(null);
    // Texto que se va escribiendo en el buscador
    const [search, setSearch] = useState('');
    // Texto ya enviado al backend (se actualiza recién al buscar)
    const [keyword, setKeyword] = useState('');
    // Orden elegido: default, asc o desc
    const [sort, setSort] = useState('default');

    const navigate = useNavigate();
    const location = useLocation();
    
    // Escucha si la Navbar nos manda una palabra para buscar
    useEffect(() => {
        if (location.state?.searchKeyword) {
            const word = location.state.searchKeyword;
            // Actualizamos los estados visuales y lógicos de la búsqueda
            setSearch(word);
            setKeyword(word);
            setPage(0);
            
            // Limpiamos el paquete oculto para que no vuelva a buscar si recargamos la página (F5)
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    // Hacemos el GET al backend cada vez que cambia la página o la búsqueda
    useEffect(()=>{
        // Armamos la URL con la paginación y, si hay búsqueda, el keyword
        let url = `${URL}/products?page=${page}&size=${PAGE_SIZE}`;
        if (keyword) {
            // encodeURIComponent evita que espacios o símbolos rompan la URL
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        fetch(url)
        .then((response)=> response.json())
        .then((data)=>{
            // Si no vienen los productos (por ejemplo, un error del servidor) saltamos al catch
            if (!data.content) {
                throw new Error("La respuesta del servidor no es válida");
            }
            // El backend devuelve una página de Spring: los productos vienen en data.content
            setProducts(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        })
        .catch((error)=>{
            console.error("Error al cargar el catalogo: ", error);
            setError(true);
        })
        // finally se ejecuta siempre, haya salido bien o mal
        .finally(()=> setLoading(false));
    }, [page, keyword]); // Se vuelve a ejecutar solo si cambia alguno de estos dos
    
    // Ordenamos por precio solo los productos de la página actual
    // Sin orden elegido se muestran como los manda el backend
    let visibleProducts = products;
    if (sort === 'asc') {
        visibleProducts = [...products].sort((a, b) => a.finalPrice - b.finalPrice);
    }
    if (sort === 'desc') {
        visibleProducts = [...products].sort((a, b) => b.finalPrice - a.finalPrice);
    }

    // Se ejecuta al buscar (con Enter o con el botón)
    const handleSearch = (e) => {
        // Evita que el formulario recargue la página
        e.preventDefault();
        const newKeyword = search.trim();
        // Si es la misma búsqueda y ya estamos en la primera página, no hay nada que pedir
        if (newKeyword === keyword && page === 0) {
            return;
        }
        setLoading(true);
        // Toda búsqueda nueva arranca desde la primera página
        setPage(0);
        setKeyword(newKeyword);
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

        // Guardamos la imagen del producto para mostrar la miniatura en el modal
        if (product.imageIds && product.imageIds.length > 0) {
            const savedImages = JSON.parse(localStorage.getItem('cartImages') || '{}');
            savedImages[product.id] = product.imageIds[0];
            localStorage.setItem('cartImages', JSON.stringify(savedImages));
        }

        fetch(`${URL}/cartItems`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId: product.id, quantity: 1 })
        })
        .then((response) => response.json())
        .then((updatedCart) => {
            if (updatedCart && updatedCart.items) {
                // Enviamos el carrito devuelto por el POST a la Navbar y abrimos el modal
                navigate(location.pathname, {
                    replace: true,
                    state: { updatedCart, timestamp: Date.now() }
                });
            }
        })
        .catch((error) => console.error("Error al agregar al carrito: ", error));
    };
    

    return (
        <section className="catalog-wrapper">
            <div className="catalog-container">

                {/* 1. Título */}
                <h2 className="catalog-title">Figuras en venta</h2>

                {/* 2. Filtros (Buscador y Orden) */}
                <div className="catalog-filters">
                    {/* Buscador: se envía con Enter o con el botón */}
                    <form className="catalog-search" onSubmit={handleSearch}>
                        <input
                            type="search"
                            className="catalog-field"
                            placeholder="Buscar personaje o figura..."
                            aria-label="Buscar figuras"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="catalog-page-btn">Buscar</button>
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

                {/* 3. Mensajes de estado (cargando, error y sin resultados) */}
                {loading && <p className="catalog-message">Cargando figuras...</p>}
                {!loading && error && (
                    <p className="catalog-message">
                        No pudimos cargar las figuras. Revisá que el servidor esté activo e intentá de nuevo.
                    </p>
                )}
                {!loading && !error && visibleProducts.length === 0 && (
                    <p className="catalog-message">
                        {keyword ? 'No hay figuras que coincidan con tu búsqueda.' : 'Todavía no hay figuras cargadas.'}
                    </p>
                )}

                {/* 4. Grilla de productos (una tarjeta por figura) */}
                {!loading && !error && visibleProducts.length > 0 && (
                    <div className="catalog-grid">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product.id ?? product.id_product} product={product} onAdd={handleAddToCart} />
                        ))}
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
