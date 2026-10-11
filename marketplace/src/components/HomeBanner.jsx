import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomeBanner.css';

const HomeBanner = () => {
    const [featuredProduct, setFeaturedProduct] = useState(null);

    useEffect(() => {
        // Hacemos el GET al backend para traer un producto destacado (el primero de la BD)
        const fetchFeaturedProduct = async () => {
            try {
                // Llamamos a tu ProductsController, pidiendo 1 solo producto
                const response = await fetch('http://localhost:8080/products?page=0&size=1');
                if (response.ok) {
                    const data = await response.json();
                    if (data.content && data.content.length > 0) {
                        setFeaturedProduct(data.content[0]);
                    }
                }
            } catch (error) {
                console.error("Error al cargar el producto para el banner:", error);
            }
        };

        fetchFeaturedProduct();
    }, []); // Array vacío para que se ejecute solo en el montaje

    // Armamos la URL de la imagen nativa usando tu ImageController
    // Si el producto no tiene imagen, se puede poner la silueta del boceto de fallback
    const imageUrl = featuredProduct && featuredProduct.imageIds && featuredProduct.imageIds.length > 0 
        ? `http://localhost:8080/images/view/${featuredProduct.imageIds[0]}`
        : null;

    return (
        <section className="home-banner-wrapper">
            <div className="home-banner-container">
                
                {/* --- PANEL IZQUIERDO --- */}
                <div className="banner-left halftone-bg">
                    
                    {/* Espiral estilo cuaderno */}
                    <div className="comic-binding">
                        {/* Generamos unos "anillos" decorativos */}
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
                        ゴゴゴ
                    </div>

                    {/* Imagen del producto de la BD */}
                    <div className="featured-image-container">
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={featuredProduct?.name || 'Figura de anime'} 
                                className="product-image"
                            />
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