import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SellerPanel.css';

const URL = 'http://localhost:8080';
const IMAGE_URL = `${URL}/images/view/`;

const getUsernameFromToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1])).sub;
    } catch {
        return null;
    }
};

const SellerPanel = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('jwtToken');

    const [currentUser, setCurrentUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [categoryId, setCategoryId] = useState('');
    const [files, setFiles] = useState([]);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const sub = getUsernameFromToken(token);

        Promise.all([
            fetch(`${URL}/users`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
            fetch(`${URL}/categories`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
            fetch(`${URL}/products/seller`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
        ])
        .then(([usersData, categoriesData, sellerProductsData]) => {
            const foundUser = (usersData.content || []).find(
                (u) => u.username === sub || u.email === sub
            );
            setCurrentUser(foundUser);

            const catList = categoriesData.content || [];
            setCategories(catList);
            if (catList.length > 0) {
                setCategoryId(catList[0].id);
            }

            if (Array.isArray(sellerProductsData)) {
                setMyProducts(sellerProductsData);
            }
        })
        .catch((err) => {
            console.error('Error al cargar panel de vendedor:', err);
            setError('Error al cargar los datos del panel.');
        })
        .finally(() => setLoading(false));
    }, [token, navigate]);

    const handleCreateCategory = (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        fetch(`${URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ description: newCategoryName.trim() })
        })
        .then((res) => {
            if (!res.ok) throw new Error('La categoría ya existe o no tenés permisos.');
            return res.json();
        })
        .then((createdCat) => {
            setCategories([...categories, createdCat]);
            setCategoryId(createdCat.id);
            setNewCategoryName('');
            setFeedback(`Categoría "${createdCat.description}" creada.`);
        })
        .catch((err) => setError(err.message));
    };

    const handleCreateProduct = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setFeedback(null);

        const productPayload = {
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            discount_percentage: Number(discountPercentage) || 0,
            id_category: Number(categoryId)
        };

        fetch(`${URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Ya existe una figura con ese nombre (revisá tus publicaciones pausadas).');
            }
            return response.json();
        })
        .then((createdProduct) => {
            const uploadPromises = Array.from(files).map((file) => {
                const formData = new FormData();
                formData.append('productId', createdProduct.id);
                formData.append('name', file.name);
                formData.append('file', file);

                return fetch(`${URL}/images`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
            });

            return Promise.all(uploadPromises).then(() => createdProduct);
        })
        .then((createdProduct) => {
            setMyProducts([...myProducts, createdProduct]);
            setName('');
            setDescription('');
            setPrice('');
            setStock('');
            setDiscountPercentage(0);
            setFiles([]);
            setFeedback('¡Figura publicada con éxito!');
        })
        .catch((err) => setError(err.message))
        .finally(() => setSubmitting(false));
    };

    const handleUpdateProduct = (productId, updatedFields) => {
        setError(null);
        setFeedback(null);

        fetch(`${URL}/products/${productId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updatedFields)
        })
        .then((res) => {
            if (!res.ok) throw new Error('No se pudo actualizar el producto.');
            return res.json();
        })
        .then((updatedProduct) => {
            setMyProducts(
                myProducts.map((p) => (p.id === productId ? updatedProduct : p))
            );
            setFeedback(
                updatedFields.state === true
                    ? `"${updatedProduct.name}" volvió a publicarse en el catálogo.`
                    : `"${updatedProduct.name}" actualizado.`
            );
        })
        .catch((err) => setError(err.message));
    };

    const handleDisableProduct = (productId) => {
        setError(null);
        setFeedback(null);

        fetch(`${URL}/products/${productId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            if (!res.ok) throw new Error('No se pudo pausar la publicación.');
            // Marcamos state: false localmente con .map() sin hacer otro GET
            setMyProducts(
                myProducts.map((p) => (p.id === productId ? { ...p, state: false } : p))
            );
            setFeedback('Publicación pausada y retirada de los carritos.');

            // Avisamos a la Navbar por si el mismo usuario la tenía en su carrito
            navigate(location.pathname, {
                replace: true,
                state: { removedProductId: productId, timestamp: Date.now() }
            });
        })
        .catch((err) => setError(err.message));
    };

    const activeProducts = myProducts.filter((p) => p.state !== false);
    const inactiveProducts = myProducts.filter((p) => p.state === false);

    if (!loading && currentUser && currentUser.role === 'BUYER') {
        return (
            <section className="seller-wrapper">
                <div className="seller-container">
                    <p className="seller-message">
                        Tu cuenta está registrada como <strong>Comprador</strong>. Para publicar figuras necesitás una cuenta de <strong>Vendedor</strong>.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="seller-wrapper">
            <div className="seller-container">
                <h2 className="seller-title">Panel de Vendedor</h2>

                {error && <p className="seller-error-box">{error}</p>}
                {feedback && <p className="seller-success-box">{feedback}</p>}

                <div className="seller-grid">
                    
                    {/* Columna 1: Formulario de Alta */}
                    <div className="seller-box">
                        <h3 className="seller-subtitle">Publicar nueva figura</h3>

                        {currentUser?.role === 'ADMIN' && (
                            <form className="seller-cat-form" onSubmit={handleCreateCategory}>
                                <input
                                    type="text"
                                    className="seller-field"
                                    placeholder="Nueva categoría (ej: JoJo, Valkyrie...)"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <button type="submit" className="seller-btn-small">
                                    + Categoría
                                </button>
                            </form>
                        )}

                        <form className="seller-form" onSubmit={handleCreateProduct}>
                            <label className="seller-label" htmlFor="prod-name">Nombre de la figura</label>
                            <input
                                id="prod-name"
                                type="text"
                                className="seller-field"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <label className="seller-label" htmlFor="prod-cat">Categoría</label>
                            <select
                                id="prod-cat"
                                className="seller-field"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                {categories.length === 0 && (
                                    <option value="">Sin categorías cargadas</option>
                                )}
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.description}
                                    </option>
                                ))}
                            </select>

                            <div className="seller-row-3">
                                <div className="seller-group">
                                    <label className="seller-label" htmlFor="prod-price">Precio ($)</label>
                                    <input
                                        id="prod-price"
                                        type="number"
                                        min="1"
                                        className="seller-field"
                                        required
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                                <div className="seller-group">
                                    <label className="seller-label" htmlFor="prod-stock">Stock</label>
                                    <input
                                        id="prod-stock"
                                        type="number"
                                        min="0"
                                        className="seller-field"
                                        required
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                    />
                                </div>
                                <div className="seller-group">
                                    <label className="seller-label" htmlFor="prod-disc">Descuento (%)</label>
                                    <input
                                        id="prod-disc"
                                        type="number"
                                        min="0"
                                        max="99"
                                        className="seller-field"
                                        value={discountPercentage}
                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <label className="seller-label" htmlFor="prod-desc">Descripción</label>
                            <textarea
                                id="prod-desc"
                                rows="3"
                                className="seller-field"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <label className="seller-label" htmlFor="prod-files">
                                Fotos del producto (una o más)
                            </label>
                            <input
                                id="prod-files"
                                type="file"
                                accept="image/*"
                                multiple
                                className="seller-field"
                                onChange={(e) => setFiles(e.target.files)}
                            />

                            <button
                                type="submit"
                                className="seller-btn-primary"
                                disabled={submitting || categories.length === 0}
                            >
                                {submitting ? 'Publicando...' : 'Publicar figura'}
                            </button>
                        </form>
                    </div>

                    {/* Columna 2: Publicaciones Activas y Eliminadas/Pausadas */}
                    <div className="seller-box">
                        <h3 className="seller-subtitle">
                            Publicaciones activas ({activeProducts.length})
                        </h3>

                        {activeProducts.length === 0 ? (
                            <p className="seller-message">No tenés figuras activas en este momento.</p>
                        ) : (
                            <div className="seller-products-list">
                                {activeProducts.map((prod) => (
                                    <SellerProductRow
                                        key={prod.id}
                                        product={prod}
                                        onUpdate={handleUpdateProduct}
                                        onDelete={handleDisableProduct}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Sección de Publicaciones Eliminadas para reactivar en 1 clic */}
                        {inactiveProducts.length > 0 && (
                            <>
                                <h3 className="seller-subtitle">
                                    Publicaciones eliminadas ({inactiveProducts.length})
                                </h3>
                                <div className="seller-products-list">
                                    {inactiveProducts.map((prod) => (
                                        <SellerProductRow
                                            key={prod.id}
                                            product={prod}
                                            onUpdate={handleUpdateProduct}
                                            onDelete={handleDisableProduct}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
};

const SellerProductRow = ({ product, onUpdate, onDelete }) => {
    const [price, setPrice] = useState(product.price);
    const [stock, setStock] = useState(product.stock);
    const [discount, setDiscount] = useState(product.discountPercentage || 0);

    const hasImage = product.imageIds && product.imageIds.length > 0;
    const isInactive = product.state === false;

    const handleSave = (e) => {
        e.preventDefault();
        onUpdate(product.id, {
            price: Number(price),
            stock: Number(stock),
            discount_percentage: Number(discount)
        });
    };

    const handleRepublish = () => {
        onUpdate(product.id, {
            price: Number(price),
            stock: Number(stock),
            discount_percentage: Number(discount),
            state: true
        });
    };

    return (
        <form className={isInactive ? 'seller-item-card inactive-card' : 'seller-item-card'} onSubmit={handleSave}>
            <div className="seller-item-header">
                <div className="seller-item-thumb">
                    {hasImage ? (
                        <img src={`${IMAGE_URL}${product.imageIds[0]}`} alt={product.name} />
                    ) : (
                        <span>ゴ</span>
                    )}
                </div>
                <div className="seller-item-title-box">
                    <h4 className="seller-item-name">{product.name}</h4>
                    <span className="seller-item-cat">
                        {product.categoryName} {isInactive && '• ELIMINADA'}
                    </span>
                </div>

                {isInactive ? (
                    <button
                        type="button"
                        className="seller-btn-secondary"
                        onClick={handleRepublish}
                    >
                        Volver a publicar
                    </button>
                ) : (
                    <button
                        type="button"
                        className="seller-btn-danger"
                        onClick={() => onDelete(product.id)}
                    >
                        Eliminar
                    </button>
                )}
            </div>

            <div className="seller-row-3">
                <div className="seller-group">
                    <label className="seller-label-sm">Precio ($)</label>
                    <input
                        type="number"
                        className="seller-field-sm"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>
                <div className="seller-group">
                    <label className="seller-label-sm">Stock</label>
                    <input
                        type="number"
                        min="0"
                        className="seller-field-sm"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                    />
                </div>
                <div className="seller-group">
                    <label className="seller-label-sm">Desc. (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="99"
                        className="seller-field-sm"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                    />
                </div>
            </div>

            {!isInactive && (
                <button type="submit" className="seller-btn-secondary">
                    Guardar cambios de stock / descuento
                </button>
            )}
        </form>
    );
};

export default SellerPanel;