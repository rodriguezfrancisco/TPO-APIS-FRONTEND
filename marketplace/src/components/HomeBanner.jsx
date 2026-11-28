import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from './Redux/productSlice';
import './HomeBanner.css';

const URL = 'http://localhost:8080';

const HomeBanner = () => {
    const dispatch = useDispatch();
    const { items: products } = useSelector((state) => state.product);

    useEffect(() => {
        if (products.length === 0) {
            dispatch(fetchProducts({ page: 0, size: 12 }));
        }
    }, [products.length, dispatch]);

    const featuredProduct = products.length > 0 ? products[0] : null;

    const imageUrl = featuredProduct && featuredProduct.imageIds && featuredProduct.imageIds.length > 0
        ? `${URL}/images/view/${featuredProduct.imageIds[0]}`
        : null;

    return (
        <section className="home-banner-wrapper">
            <div className="home-banner-container">

                {/* --- PANEL IZQUIERDO --- */}
                <div className="banner-left halftone-bg">

                    {/* Espiral estilo cuaderno */}
                    <div className="comic-binding">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="binding-ring"></div>
                        ))}
                    </div>

                    <h1 className="banner-title">
                        <span className="text-solid">Llevate</span><br />
                        <span className="text-outline">tu figura</span><br />
                        <span className="text-solid">de anime</span>
                    </h1>

                    <div className="banner-text-box">
                        <p>
                            Figuras de Shuumatsu no Valkyrie, JoJo y más. Elegí la que te falta y armá tu pedido.
                        </p>
                    </div>

                    <div className="banner-actions">
                        <Link to="/products" className="btn-comic btn-white">Ver figuras</Link>
                        <Link to="/how-to-buy" className="btn-comic btn-black">Cómo comprar</Link>
                    </div>
                </div>

                {/* --- PANEL DERECHO --- */}
                <div className="banner-right action-lines-bg">

                    {/* Globo de texto */}
                    <div className="speech-bubble">
                        ¡La quiero!
                        <div className="bubble-tail"></div>
                    </div>

                    {/* Símbolos decorativos (ゴゴゴ) */}
                    <div className="comic-symbols">
                        <span>ゴ</span>
                        <span>ゴ</span>
                        <span>ゴ</span>
                    </div>

                    {/* Imagen del producto de la BD */}
                    <div className="featured-image-container">
                        {imageUrl && featuredProduct?.id ? (
                            <Link
                                to={`/products/${featuredProduct.id}`}
                                className="featured-product-link"
                                aria-label={`Ver detalle de ${featuredProduct.name}`}
                            >
                                <img
                                    src={imageUrl}
                                    alt={featuredProduct.name || 'Figura de anime'}
                                    className="product-image"
                                />
                            </Link>
                        ) : (
                            <div className="placeholder-silhouette"></div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeBanner;