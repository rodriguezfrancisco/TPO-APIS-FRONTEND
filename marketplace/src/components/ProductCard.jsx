import './ProductCard.css';

// URL base para ver las imágenes que guarda el backend
const IMAGE_URL = 'http://localhost:8080/images/view/';

// Convierte un número en pesos argentinos (ej: 159900 -> $ 159.900)
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price);
};

const ProductCard = ({ product, onAdd }) => {
    // Si el producto tiene al menos una imagen cargada
    const hasImage = product.imageIds && product.imageIds.length > 0;
    // Agotada cuando el stock llega a 0
    const soldOut = typeof product.stock === 'number' && product.stock <= 0;
    // El backend manda el porcentaje de descuento y el precio final ya calculado
    const hasDiscount = product.discountPercentage > 0;
    const finalPrice = product.finalPrice ?? product.price;

    return (
        <article className="product-card">

            {/* 1. Imagen (o la silueta ゴ si el producto no tiene) */}
            <div className="card-image-box halftone-card">
                {hasImage ? (
                    <img src={`${IMAGE_URL}${product.imageIds[0]}`} alt={product.name} className="card-image" loading="lazy"/>
                ) : (
                    <div className="card-placeholder">
                        <span>ゴ</span>
                    </div>
                )}
                {/* Etiquetas sobre la imagen */}
                {soldOut && <span className="card-sold-out">Agotada</span>}
                {hasDiscount && <span className="card-discount">-{product.discountPercentage}%</span>}
            </div>

            {/* 2. Datos del producto */}
            <div className="card-info">
                {product.categoryName && <span className="card-category">{product.categoryName}</span>}
                <h3 className="card-name">{product.name}</h3>
                {/* Precio: con descuento se muestra el original tachado y al lado el final */}
                <div className="card-price-box">
                    {hasDiscount && <span className="card-price-old">{formatPrice(product.price)}</span>}
                    <span className="card-price">{formatPrice(finalPrice)}</span>
                </div>
                {/* Botón de agregar: solo aparece si el componente padre le pasa onAdd */}
                {onAdd && (
                    <button type="button" className="card-btn" disabled={soldOut} onClick={() => onAdd(product)}>
                        {soldOut ? 'Agotada' : 'Agregar'}
                    </button>
                )}
            </div>
        </article>
    );
};

export default ProductCard;
