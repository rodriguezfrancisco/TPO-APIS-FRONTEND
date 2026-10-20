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

const ProductDetail = ({ onAdd }) => {
    // Id del producto que viene en la URL (/products/:id)
    const { id } = useParams();
    // Producto que devuelve el backend
    const [product, setProduct] = useState(null);
    // Posición de la imagen grande dentro de la lista de imágenes del producto
    const [selectedImage, setSelectedImage] = useState(0);
    // Mientras es true se muestra "Cargando figura..."
    const [loading, setLoading] = useState(true);
    // Pasa a true si falla la carga
    const [error, setError] = useState(null);

    // Hacemos el GET de un solo producto cada vez que cambia el id de la URL
    useEffect(()=>{
        fetch(`${URL}/products/${id}`)
        .then((response)=> response.json())
        .then((data)=>{
            if (!data.id) {
                throw new Error("La respuesta del servidor no es válida");
            }
            setProduct(data);
            setError(null);
        })
        .catch((error)=>{
            console.error("Error al cargar el producto: ", error);
            setError(true);
        })
        .finally(()=> setLoading(false));
    }, [id]);

    // Datos calculados a partir del producto (valen null mientras no se cargó)
    const hasImage = product && product.imageIds && product.imageIds.length > 0;
    const soldOut = product && product.stock <= 0;
    const hasDiscount = product && product.discountPercentage > 0;

    const navigate = useNavigate();
    const location = useLocation();

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
                 state: { updatedCart, openCart: true, timestamp: Date.now() }
             });
         }
     })
     .catch((error) => console.error("Error al agregar al carrito: ", error));
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
                            {/* Botón de agregar: solo aparece si el componente padre le pasa onAdd */}
    
                            <button type="button" className="detail-btn" disabled={soldOut} onClick={() => handleAddToCart(product)}>
                                    {soldOut ? 'Agotada' : 'Agregar al carrito'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductDetail;
