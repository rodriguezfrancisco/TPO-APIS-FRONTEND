import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SellerPanel.css';

const URL = 'http://localhost:8080';
const IMAGE_URL = `${URL}/images/view/`;

const getUsernameFromToken = (token) => {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)).sub;
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
    const [fileInputKey, setFileInputKey] = useState(0);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

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
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ description: newCategoryName.trim() })
        };
        fetch(`${URL}/categories`, options)
        .then((res) => {
            if (!res.ok) {
                // Leemos el mensaje que mandó el backend (si el cuerpo no es un JSON, usamos un objeto vacío)
                return res.json()
                .catch(() => ({}))
                .then((data) => { throw new Error(data.message || 'La categoría ya existe o no tenés permisos.'); });
            }
            return res.json();
        })
        .then((createdCat) => {
            setCategories([...categories, createdCat]);
            setCategoryId(createdCat.id);
            setNewCategoryName('');
            setFeedback(`Categoría "${createdCat.description}" creada.`);
        })
        .catch((err) => setError(err.name === 'Error' ? err.message : 'No pudimos completar la acción. Revisá que el servidor esté activo y que tu sesión siga iniciada.'));
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
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        };
        fetch(`${URL}/products`, options)
        .then((response) => {
            if (!response.ok) {
                // Leemos el mensaje que mandó el backend (si el cuerpo no es un JSON, usamos un objeto vacío)
                return response.json()
                .catch(() => ({}))
                .then((data) => { throw new Error(data.message || 'Ya existe una figura con ese nombre (revisá tus publicaciones pausadas).'); });
            }
            return response.json();
        })
        .then((createdProduct) => {
            // Agregamos el producto a la lista con spread (sin otro GET) y limpiamos el formulario
            setMyProducts([...myProducts, createdProduct]);
            setName('');
            setDescription('');
            setPrice('');
            setStock('');
            setDiscountPercentage(0);
            setFiles([]);
            setFileInputKey(fileInputKey + 1);

            // Si adjuntó fotos, las subimos todas juntas a POST /images (cada una devuelve null si salió bien o su mensaje de error)
            const uploadPromises = Array.from(files).map((file) => {
                const formData = new FormData();
                formData.append('productId', createdProduct.id);
                formData.append('name', file.name);
                formData.append('file', file);
                const options = {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                };
                return fetch(`${URL}/images`, options)
                .then((res) => {
                    // Si falla la subida, guardamos el mensaje que mandó el backend (si salió bien, null)
                    if (!res.ok) {
                        return res.json()
                        .catch(() => ({}))
                        .then((data) => data.message || `No se pudo subir la imagen ${file.name}.`);
                    }
                    return null;
                })
                .catch(() => `No se pudo subir la imagen ${file.name}.`);
            });

            // Esperamos a que terminen todas y avisamos el resultado
            return Promise.all(uploadPromises).then((results) => {
                const imageErrors = results.filter((message) => message !== null);
                // Si alguna foto falló, lanzamos el aviso para que lo muestre el catch (la figura ya quedó publicada)
                if (imageErrors.length > 0) {
                    throw new Error(`La figura se publicó, pero hubo errores con las imágenes: ${imageErrors.join(' ')}`);
                }
                setFeedback('¡Figura publicada con éxito!');
            });
        })
        .catch((err) => setError(err.name === 'Error' ? err.message : 'No pudimos completar la acción. Revisá que el servidor esté activo y que tu sesión siga iniciada.'))
        .finally(() => setSubmitting(false));
    };

    const handleUpdateProduct = (productId, updatedFields) => {
        setError(null);
        setFeedback(null);

        const sameName = myProducts.find((p) => p.id !== productId && p.name.toLowerCase() === updatedFields.name.toLowerCase());
        if (sameName) {
            setError(`Ya tenés otra figura llamada "${sameName.name}". Elegí un nombre distinto.`);
            return;
        }
        const options = {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updatedFields)
        };
        fetch(`${URL}/products/${productId}`, options)
        .then((res) => {
            if (!res.ok) {
                // Leemos el mensaje que mandó el backend (si el cuerpo no es un JSON, usamos un objeto vacío)
                return res.json()
                .catch(() => ({}))
                .then((data) => { throw new Error(data.message || 'No se pudo actualizar el producto.'); });
            }
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
        .catch((err) => setError(err.name === 'Error' ? err.message : 'No pudimos completar la acción. Revisá que el servidor esté activo y que tu sesión siga iniciada.'));
    };

    const handleDisableProduct = (productId) => {
        setError(null);
        setFeedback(null);
        const options = {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        };
        fetch(`${URL}/products/${productId}`, options)
        .then((res) => {
            if (!res.ok) {
                // Leemos el mensaje que mandó el backend (si el cuerpo no es un JSON, usamos un objeto vacío)
                return res.json()
                .catch(() => ({}))
                .then((data) => { throw new Error(data.message || 'No se pudo pausar la publicación.'); });
            }
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
        .catch((err) => setError(err.name === 'Error' ? err.message : 'No pudimos completar la acción. Revisá que el servidor esté activo y que tu sesión siga iniciada.'));
    };

    const activeProducts = myProducts.filter((p) => p.state !== false);
    const inactiveProducts = myProducts.filter((p) => p.state === false);

    if (loading || !currentUser) {
        return (
            <section className="seller-wrapper">
                <div className="seller-container">
                    <p className="seller-message">
                        {loading ? 'Cargando panel...' : (error || 'No pudimos identificar tu cuenta. Volvé a iniciar sesión.')}
                    </p>
                </div>
            </section>
        );
    }

    if (currentUser.role === 'BUYER') {
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
                                key={fileInputKey}
                                id="prod-files"
                                type="file"
                                accept="image/*"
                                multiple
                                className="seller-field"
                                onChange={(e) => setFiles(e.target.files)}
                            />
                            <p className="seller-hint">
                                Para elegir varias fotos, mantené Ctrl (o Shift) apretado mientras las seleccionás en la misma ventana.
                           </p>
                            {files.length > 0 && (
                                <p className="seller-hint">
                                    {files.length} {files.length === 1 ? 'foto elegida' : 'fotos elegidas'}: {Array.from(files).map((file) => file.name).join(', ')}
                                </p>
                            )}

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
                        <button
                            type="button"
                            className="seller-toggle"
                            aria-expanded={showInactive}
                            onClick={() => setShowInactive(!showInactive)}
                        >
                            <span>Publicaciones eliminadas ({inactiveProducts.length})</span>
                            <span>{showInactive ? '▲ Ocultar' : '▼ Mostrar'}</span>
                        </button>
                        {showInactive && (
                            inactiveProducts.length === 0 ? (
                                <p className="seller-message">Todavía no eliminaste ninguna figura.</p>
                            ) : (
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
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const SellerProductRow = ({ product, onUpdate, onDelete }) => {
    const [name, setName] = useState(product.name);
    const [description, setDescription] = useState(product.description || '');
    const [price, setPrice] = useState(product.price);
    const [stock, setStock] = useState(product.stock);
    const [discount, setDiscount] = useState(product.discountPercentage || 0);

    const hasImage = product.imageIds && product.imageIds.length > 0;
    const isInactive = product.state === false;

    const handleSave = (e) => {
        e.preventDefault();
        onUpdate(product.id, {
            name: name.trim() || product.name,
            description: description.trim() || product.description,
            price: Number(price),
            stock: Number(stock),
            discount_percentage: Number(discount)
        });
    };

    const handleRepublish = () => {
        onUpdate(product.id, {
            name: name.trim() || product.name,
            description: description.trim() || product.description,
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

            <div className="seller-group">
                <label className="seller-label-sm">Nombre</label>
                <input
                    type="text"
                    className="seller-field-sm"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="seller-group">
                <label className="seller-label-sm">Descripción</label>
                <textarea
                    rows="2"
                    className="seller-field-sm"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
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
                    Guardar cambios
                </button>
            )}
        </form>
    );
};

export default SellerPanel;
