import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import './ProductDetail.css';

// URL base del backend
const URL = 'http://localhost:8080';
// URL base para ver las imágenes que guarda el backend
const IMAGE_URL = `${URL}/images/view/`;

// Convierte un número en pesos argentinos (ej: 159900 -> $ 159.900)
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price);
};

const ProductDetail = () => {
    // Id del producto que viene en la URL (/products/:id)
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Producto que devuelve el backend
    const [product, setProduct] = useState(null);
    // Posición de la imagen grande dentro de la lista de imágenes del producto
    const [selectedImage, setSelectedImage] = useState(0);
    // Cantidad seleccionada para agregar al carrito
    const [quantity, setQuantity] = useState(1);
    // Cantidad de este producto que ya está en el carrito
    const [cartQuantity, setCartQuantity] = useState(0);
    // Mientras es true se muestra "Cargando figura..."
    const [loading, setLoading] = useState(true);
    // Pasa a true si falla la carga
    const [error, setError] = useState(null);
    // Mensaje si falla al agregar al carrito (por ejemplo, si supera el stock)
    const [cartError, setCartError] = useState(null);

    // 1. Etapa de montaje: cargamos el detalle del producto
    useEffect(() => {
        setQuantity(1);
        setCartError(null);
        fetch(`${URL}/products/${id}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.id) {
                throw new Error("La respuesta del servidor no es válida");
            }
            setProduct(data);
            setError(null);
        })
        .catch((error) => {
            console.error("Error al cargar el producto: ", error);
            setError(true);
        })
        .finally(() => setLoading(false));
    }, [id]);

    // 2. Etapa de montaje: consultamos cuántas unidades de esta figura hay en el carrito
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            setCartQuantity(0);
            return;
        }

        fetch(`${URL}/carts`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
            if (data && data.items) {
                const found = data.items.find((item) => item.productId === Number(id));
                setCartQuantity(found ? found.quantity : 0);
            }
        })
        .catch((err) => console.error("Error al obtener carrito en detalle: ", err));
    }, [id]);

    // 3. Escuchamos cambios del carrito (al agregar acá o modificar desde el modal) sin hacer otro GET
    useEffect(() => {
        if (location.state?.updatedCart) {
            const items = location.state.updatedCart.items || [];
            const found = items.find((item) => item.productId === Number(id));
            setCartQuantity(found ? found.quantity : 0);

            // Volvemos a pedir el producto para que el stock que se muestra esté al día (por ejemplo, después de comprar)
            fetch(`${URL}/products/${id}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.id) {
                    setProduct(data);
                }
            })
            .catch((err) => console.error("Error al actualizar el producto: ", err));
        }
    }, [location.state, id]);

    // Datos calculados a partir del producto
    const hasImage = product && product.imageIds && product.imageIds.length > 0;
    const soldOut = product && product.stock <= 0;
    const hasDiscount = product && product.discountPercentage > 0;

    // Disminuye en 1 la cantidad a agregar (mínimo 1)
    const handleDecrease = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    // Aumenta en 1 la cantidad a agregar (máximo el stock disponible)
    const handleIncrease = () => {
        if (product && quantity < product.stock) {
            setQuantity(quantity + 1);
        }
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

        fetch(`${URL}/cartItems`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId: product.id, quantity: quantity })
        })
        .then((response) => response.json())
        .then((updatedCart) => {
            if (updatedCart && updatedCart.items) {
                // Enviamos el carrito devuelto por el POST a la Navbar y actualizamos el badge local
                navigate(location.pathname, {
                    replace: true,
                    state: { updatedCart, timestamp: Date.now() }
                });
                setQuantity(1);
            } else {
                throw new Error((updatedCart && updatedCart.message) || 'No hay suficiente stock disponible.');
            }
        })
        .catch((err) => {
            console.error("Error al agregar al carrito: ", err);
            setCartError(err.name === 'Error' ? err.message : 'No pudimos agregar la figura al carrito.');
        });
    };

    return (
        <section className="detail-wrapper">
            <div className="detail-container">

                {/* 1. Link para volver al catálogo */}
                <Link to="/products" className="detail-back">← Volver al catálogo</Link>

                {/* 2. Mensajes de estado (cargando y error) */}
                {loading && <p className="detail-message">Cargando figura...</p>}

                {!loading && error && (
                    <p className="detail-message">
                        No pudimos cargar la figura. Puede que no exista o que el servidor no esté activo.
                    </p>
                )}

                {/* 3. Detalle del producto */}
                {!loading && product && (
                    <div className="detail-grid">

                        {/* Galería: imagen grande y miniaturas */}
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

                                {/* Etiquetas sobre la imagen */}
                                {soldOut && <span className="detail-sold-out">Agotada</span>}
                                {hasDiscount && <span className="detail-discount">-{product.discountPercentage}%</span>}
                            </div>

                            {/* Las miniaturas solo aparecen si el producto tiene más de una imagen */}
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

                            {/* Precio: con descuento se muestra el original tachado y al lado el final */}
                            <div className="detail-price-box">
                                {hasDiscount && <span className="detail-price-old">{formatPrice(product.price)}</span>}
                                <span className="detail-price">{formatPrice(product.finalPrice ?? product.price)}</span>
                            </div>

                            <p className="detail-stock">
                                {soldOut ? 'Agotada' : `${product.stock} ${product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`}
                            </p>

                            {product.description && <p className="detail-description">{product.description}</p>}

                            {product.sellerUsername && <p className="detail-seller">Vendido por {product.sellerUsername}</p>}

                            {cartError && <p className="detail-message" role="alert">{cartError}</p>}

                            {/* Selector (- cantidad +) a la izquierda y botón Agregar con su contador a la derecha */}
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
                                        disabled={soldOut}
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
