import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './Catalog.css';

const PAGE_SIZE = 12;

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [keyword, setKeyword] = useState('');
    const [sort, setSort] = useState('default');

    useEffect(() => {
        let url = `http://localhost:8080/products?page=${page}&size=${PAGE_SIZE}`;
        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const list = Array.isArray(data) ? data : data.content || [];
            setProducts(list);
            setTotalPages(Array.isArray(data) ? 1 : data.totalPages || 1);
            setError(null);
        })
        .catch((error) => {
            console.error("Error al cargar el catalogo: ", error);
            setError(true);
        })
        .finally(() => setLoading(false));
    }, [page, keyword]);

    let visibleProducts = products;
    if (sort === 'asc') {
        visibleProducts = [...products].sort((a, b) => a.price - b.price);
    }
    if (sort === 'desc') {
        visibleProducts = [...products].sort((a, b) => b.price - a.price);
    }

    const handleSearch = (e) => {
        e.preventDefault();
        const newKeyword = search.trim();
        if (newKeyword === keyword && page === 0) {
            return;
        }
        setLoading(true);
        setPage(0);
        setKeyword(newKeyword);
    };

    const changePage = (newPage) => {
        setLoading(true);
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="catalog-wrapper">
            <div className="catalog-container">
                <h2 className="catalog-title">Figuras en venta</h2>
                <div className="catalog-filters">
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
                {!loading && !error && visibleProducts.length > 0 && (
                    <div className="catalog-grid">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product.id ?? product.id_product} product={product} />
                        ))}
                    </div>
                )}
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
