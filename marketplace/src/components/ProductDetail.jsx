import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from './Redux/productSlice';
import { addToCart } from './Redux/cartSlice';
import './ProductDetail.css';

const URL = 'http://localhost:8080';
const IMAGE_URL = `${URL}/images/view/`;

const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price);
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token } = useSelector((state) => state.user);
    const { selected, loading, error } = useSelector((state) => state.product);
    const { items: cartItems, loading: cartLoading, error: cartError } = useSelector((state) => state.cart);

    // Estados locales solo de interfaz
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [cartActionAttempted, setCartActionAttempted] = useState(false);

    // Etapa de montaje: cargamos el detalle de la figura
    useEffect(() => {
        setSelectedImage(0);
        setQuantity(1);
        setCartActionAttempted(false);
        dispatch(fetchProductById(id));
    }, [id, dispatch]);

    // Evita mostrar brevemente el producto anterior mientras carga el nuevo
    const product = selected && String(selected.id) === String(id) ? selected : null;

    // Cantidad de esta figura que ya está en el carrito (leída directo de Redux)
    const foundInCart = cartItems.find((item) => item.productId === Number(id));
    const cartQuantity = foundInCart ? foundInCart.quantity : 0;

    const hasImage = product && product.imageIds && product.imageIds.length > 0;
    const soldOut = product && product.stock <= 0;
    const hasDiscount = product && product.discountPercentage > 0;

    const handleDecrease = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleIncrease = () => {
        if (product && quantity < product.stock) {
            setQuantity(quantity + 1);
        }
    };

    const handleAddToCart = async (prod) => {
        if (!token) {
            navigate('/login');
            return;
        }
        setCartActionAttempted(true);
        const result = await dispatch(addToCart({
            token,
            productId: prod.id,
            quantity
        }));

        if (addToCart.fulfilled.match(result)) {
            setQuantity(1);
        }
    };

    return (
        <section className="detail-wrapper">
            <div className="detail-container">

                {/* 1. Link para volver al catálogo */}
                <Link to="/products" className="detail-back">← Volver al catálogo</Link>

                {/* 2. Mensajes de estado */}
                {loading && !product && <p className="detail-message">Cargando figura...</p>}
                {!loading && error && !product && <p className="detail-message">{error}</p>}

                {/* 3. Detalle del producto */}
                {product && (
                    <div className="detail-grid">

                        {/* Galería */}
                        <div className="detail-gallery">
                            <div className="detail-image-box halftone-detail">
                                {hasImage ? (
                                    <img
                                        src={`${IMAGE_URL}${product.imageIds[selectedImage]}`}
                                        alt={product.name}
                                        className="detail-image"
                                    />
                                ) : (
                                    <div className="detail-placeholder">
                                        <span>ゴ</span>
                                    </div>
                                )}

                                {soldOut && <span className="detail-sold-out">Agotada</span>}
                                {hasDiscount && <span className="detail-discount">-{product.discountPercentage}%</span>}
                            </div>

                            {hasImage && product.imageIds.length > 1 && (
                                <div className="detail-thumbs">
                                    {product.imageIds.map((imageId, index) => (
                                        <button
                                            key={imageId}
                                            type="button"
                                            className={index === selectedImage ? 'detail-thumb active' : 'detail-thumb'}
                                            aria-label={`Ver imagen ${index + 1}`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <img src={`${IMAGE_URL}${imageId}`} alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Datos del producto */}
                        <div className="detail-info">
                            {product.categoryName && <span className="detail-category">{product.categoryName}</span>}
                            <h2 className="detail-name">{product.name}</h2>

                            <div className="detail-price-box">
                                {hasDiscount && <span className="detail-price-old">{formatPrice(product.price)}</span>}
                                <span className="detail-price">{formatPrice(product.finalPrice ?? product.price)}</span>
                            </div>

                            <p className="detail-stock">
                                {soldOut ? 'Agotada' : `${product.stock} ${product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`}
                            </p>

                            {product.description && <p className="detail-description">{product.description}</p>}
                            {product.sellerUsername && <p className="detail-seller">Vendido por {product.sellerUsername}</p>}

                            {cartActionAttempted && cartError && (
                                <p className="detail-message" role="alert">{cartError}</p>
                            )}

                            {/* Selector (- cantidad +) y botón Agregar */}
                            <div className="detail-actions">
                                <div className="detail-qty-box">
                                    <button
                                        type="button"
                                        className="detail-qty-btn"
                                        disabled={soldOut || quantity <= 1}
                                        onClick={handleDecrease}
                                        aria-label="Disminuir cantidad"
                                    >
                                        -
                                    </button>
                                    <span className="detail-qty-value">{soldOut ? 0 : quantity}</span>
                                    <button
                                        type="button"
                                        className="detail-qty-btn"
                                        disabled={soldOut || quantity >= product.stock}
                                        onClick={handleIncrease}
                                        aria-label="Aumentar cantidad"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="detail-btn-container">
                                    <button
                                        type="button"
                                        className="detail-btn"
                                        disabled={soldOut || cartLoading}
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        {soldOut ? 'Agotada' : 'Agregar al carrito'}
                                    </button>
                                    {cartQuantity > 0 && (
                                        <div className="detail-cart-badge">
                                            {cartQuantity}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </section>
    );
};

export default ProductDetail;