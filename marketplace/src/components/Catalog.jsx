import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setPage, setFilters } from './Redux/productSlice';
import { fetchCategories } from './Redux/categorySlice';
import { addToCart } from './Redux/cartSlice';
import ProductCard from './ProductCard';
import './Catalog.css';

const PAGE_SIZE = 12;
const EMPTY_FILTERS = { keyword: '', categoryId: '', minPrice: '', maxPrice: '' };

const sameFilters = (a, b) => {
    return (
        a.keyword === b.keyword &&
        a.categoryId === b.categoryId &&
        a.minPrice === b.minPrice &&
        a.maxPrice === b.maxPrice
    );
};

const Catalog = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token } = useSelector((state) => state.user);
    const { items: products, page, totalPages, filters, loading, error } = useSelector((state) => state.product);
    const { items: categories } = useSelector((state) => state.category);
    const { items: cartItems, error: cartError } = useSelector((state) => state.cart);

    // Estados locales solo para controlar los inputs y el orden visual
    const [search, setSearch] = useState(filters.keyword);
    const [categoryInput, setCategoryInput] = useState(filters.categoryId);
    const [minPriceInput, setMinPriceInput] = useState(filters.minPrice);
    const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice);
    const [filterError, setFilterError] = useState(null);
    const [sort, setSort] = useState('default');
    const [cartActionAttempted, setCartActionAttempted] = useState(false);

    // Sincroniza los inputs si los filtros cambian desde la Navbar
    useEffect(() => {
        setSearch(filters.keyword);
        setCategoryInput(filters.categoryId);
        setMinPriceInput(filters.minPrice);
        setMaxPriceInput(filters.maxPrice);
    }, [filters]);

    // Cargamos las categorías una sola vez si todavía no están en Redux
    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [categories.length, dispatch]);

    // Pedimos los productos cuando cambia la página o los filtros aplicados
    useEffect(() => {
        const params = { page, size: PAGE_SIZE };
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.minPrice !== '') params.minPrice = filters.minPrice;
        if (filters.maxPrice !== '') params.maxPrice = filters.maxPrice;

        dispatch(fetchProducts(params));
    }, [page, filters, dispatch]);

    // Productos sin stock al final, y el resto según el orden elegido
    const visibleProducts = [...products].sort((a, b) => {
        const aAgotada = a.stock === 0;
        const bAgotada = b.stock === 0;
        if (aAgotada && !bAgotada) return 1;
        if (bAgotada && !aAgotada) return -1;
        if (sort === 'asc') return a.finalPrice - b.finalPrice;
        if (sort === 'desc') return b.finalPrice - a.finalPrice;
        return 0;
    });

    const hasFilters = !sameFilters(filters, EMPTY_FILTERS);

    const handleSearch = (e) => {
        e.preventDefault();
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
        if (sameFilters(newFilters, filters) && page === 0) {
            return;
        }
        dispatch(setFilters(newFilters));
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryInput('');
        setMinPriceInput('');
        setMaxPriceInput('');
        setFilterError(null);
        if (!hasFilters && page === 0) {
            return;
        }
        dispatch(setFilters(EMPTY_FILTERS));
    };

    const changePage = (newPage) => {
        dispatch(setPage(newPage));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddToCart = (product) => {
        if (!token) {
            navigate('/login');
            return;
        }
        setCartActionAttempted(true);
        dispatch(addToCart({
            token,
            productId: product.id ?? product.id_product,
            quantity: 1
        }));
    };

    return (
        <section className="catalog-wrapper">
            <div className="catalog-container">

                {/* 1. Título */}
                <h2 className="catalog-title">Figuras en venta</h2>

                {/* 2. Filtros (Buscador, categoría, precio y orden) */}
                <div className="catalog-filters">
                    <form className="catalog-search" onSubmit={handleSearch}>
                        <input
                            type="search"
                            className="catalog-field catalog-search-input"
                            placeholder="Buscar personaje o figura..."
                            aria-label="Buscar figuras"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {categories.length > 0 && (
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
                        {hasFilters && (
                            <button type="button" className="catalog-page-btn catalog-clear-btn" onClick={clearFilters}>Limpiar</button>
                        )}
                    </form>

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

                {/* 3. Mensajes de estado */}
                {loading && <p className="catalog-message">Cargando figuras...</p>}
                {!loading && error && <p className="catalog-message">{error}</p>}
                {!loading && !error && visibleProducts.length === 0 && (
                    <p className="catalog-message">
                        {hasFilters ? 'No hay figuras que coincidan con tu búsqueda.' : 'Todavía no hay figuras cargadas.'}
                    </p>
                )}

                {cartActionAttempted && cartError && (
                    <p className="catalog-message" role="alert">{cartError}</p>
                )}

                {/* 4. Grilla de productos */}
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

                {/* 5. Paginación */}
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