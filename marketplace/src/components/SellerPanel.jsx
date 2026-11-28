import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from './Redux/userSlice';
import { fetchCategories, createCategory } from './Redux/categorySlice';
import {
    fetchSellerProducts,
    createProduct,
    uploadProductImage,
    updateProduct,
    disableProduct
} from './Redux/productSlice';
import './SellerPanel.css';

const URL = 'http://localhost:8080';
const IMAGE_URL = `${URL}/images/view/`;

const SellerPanel = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token, currentUser, loading: userLoading } = useSelector((state) => state.user);
    const { items: categories, error: categoryError } = useSelector((state) => state.category);
    const {
        sellerItems: myProducts,
        loading: productLoading,
        error: productError
    } = useSelector((state) => state.product);

    // Estados locales del formulario de alta
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [categoryId, setCategoryId] = useState('');
    const [files, setFiles] = useState([]);
    const [fileInputKey, setFileInputKey] = useState(0);

    // Estados locales de UI y feedback
    const [newCategoryName, setNewCategoryName] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [sellerLoaded, setSellerLoaded] = useState(false);
    const [lastAction, setLastAction] = useState(null);

    // Etapa de montaje: verificamos sesión, perfil, categorías y publicaciones del vendedor
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        if (!currentUser) {
            dispatch(fetchUsers(token));
        }
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
        if (currentUser && currentUser.role !== 'BUYER' && !sellerLoaded) {
            dispatch(fetchSellerProducts(token));
            setSellerLoaded(true);
        }
    }, [token, currentUser, categories.length, sellerLoaded, dispatch, navigate]);

    // Selecciona la primera categoría disponible cuando se cargan
    useEffect(() => {
        if (categories.length > 0 && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [categories, categoryId]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setLocalError(null);
        setFeedback(null);
        setLastAction('category');

        const result = await dispatch(createCategory({
            token,
            description: newCategoryName.trim()
        }));

        if (createCategory.fulfilled.match(result)) {
            const createdCat = result.payload;
            setCategoryId(createdCat.id);
            setNewCategoryName('');
            setFeedback(`Categoría "${createdCat.description}" creada.`);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setLocalError(null);
        setFeedback(null);
        setLastAction('product');

        const productPayload = {
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            discount_percentage: Number(discountPercentage) || 0,
            id_category: Number(categoryId)
        };

        const result = await dispatch(createProduct({ token, product: productPayload }));

        if (createProduct.fulfilled.match(result)) {
            const createdProduct = result.payload;
            const selectedFiles = Array.from(files);

            // Limpiamos el formulario
            setName('');
            setDescription('');
            setPrice('');
            setStock('');
            setDiscountPercentage(0);
            setFiles([]);
            setFileInputKey((prev) => prev + 1);

            let imageErrors = [];

            // Subimos las imágenes una por una mediante Redux para respetar el orden
            for (const file of selectedFiles) {
                const imgResult = await dispatch(uploadProductImage({
                    token,
                    productId: createdProduct.id,
                    file
                }));
                if (uploadProductImage.rejected.match(imgResult)) {
                    imageErrors = [...imageErrors, `No se pudo subir la imagen ${file.name}.`];
                }
            }

            if (imageErrors.length > 0) {
                setLocalError(`La figura se publicó, pero hubo errores con las imágenes: ${imageErrors.join(' ')}`);
            } else {
                setFeedback('¡Figura publicada con éxito!');
            }
        }

        setSubmitting(false);
    };

    const handleUpdateProduct = async (productId, updatedFields) => {
        setLocalError(null);
        setFeedback(null);

        const sameName = myProducts.find(
            (p) => p.id !== productId && p.name.toLowerCase() === updatedFields.name.toLowerCase()
        );
        if (sameName) {
            setLocalError(`Ya tenés otra figura llamada "${sameName.name}". Elegí un nombre distinto.`);
            return;
        }

        setLastAction('product');
        const result = await dispatch(updateProduct({
            token,
            id: productId,
            changes: updatedFields
        }));

        if (updateProduct.fulfilled.match(result)) {
            const updatedProduct = result.payload;
            setFeedback(
                updatedFields.state === true
                    ? `"${updatedProduct.name}" volvió a publicarse en el catálogo.`
                    : `"${updatedProduct.name}" actualizado.`
            );
        }
    };

    const handleDisableProduct = async (productId) => {
        setLocalError(null);
        setFeedback(null);
        setLastAction('product');

        const result = await dispatch(disableProduct({ token, id: productId }));

        if (disableProduct.fulfilled.match(result)) {
            setFeedback('Publicación pausada y retirada de los carritos.');
        }
    };

    const activeProducts = myProducts.filter((p) => p.state !== false);
    const inactiveProducts = myProducts.filter((p) => p.state === false);

    const reduxError = lastAction === 'category' ? categoryError : lastAction === 'product' ? productError : null;
    const errorMessage = localError || reduxError;

    if (userLoading || !currentUser) {
        return (
            <section className="seller-wrapper">
                <div className="seller-container">
                    <p className="seller-message">
                        {userLoading ? 'Cargando panel...' : 'No pudimos identificar tu cuenta. Volvé a iniciar sesión.'}
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

                {errorMessage && <p className="seller-error-box">{errorMessage}</p>}
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

                    {/* Columna 2: Publicaciones Activas y Desactivadas */}
                    <div className="seller-box">
                        <h3 className="seller-subtitle">
                            Publicaciones activas ({activeProducts.length})
                        </h3>

                        {productLoading && myProducts.length === 0 ? (
                            <p className="seller-message">Cargando publicaciones...</p>
                        ) : activeProducts.length === 0 ? (
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

                        <button
                            type="button"
                            className="seller-toggle"
                            aria-expanded={showInactive}
                            onClick={() => setShowInactive(!showInactive)}
                        >
                            <span>Publicaciones desactivadas ({inactiveProducts.length})</span>
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
                        Desactivar
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