import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeOneFromCart, removeFromCart } from './Redux/cartSlice';
import { checkoutOrders } from './Redux/orderSlice';
import './CartModal.css';

const URL = 'http://localhost:8080';
const IMAGE_URL = `${URL}/images/view/`;

const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price || 0);
};

const CartModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token } = useSelector((state) => state.user);
    const { items, total, loading: cartLoading, error: cartError } = useSelector((state) => state.cart);
    const { loading: orderLoading, error: orderError } = useSelector((state) => state.order);
    const { items: products, selected: selectedProduct } = useSelector((state) => state.product);

    // Paso actual del modal: 1 (Carrito), 2 (Tus datos), 3 (Listo)
    const [step, setStep] = useState(1);

    // Campos del Paso 2 (requeridos por OrderRequest en el backend)
    const [paymentMethod, setPaymentMethod] = useState('Tarjeta de crédito / débito');
    const [deliveryMethod, setDeliveryMethod] = useState('Envío a domicilio gratis');

    // Orden generada al confirmar en el Paso 3 y control para mostrar errores solo de la acción actual
    const [completedOrder, setCompletedOrder] = useState(null);
    const [actionAttempted, setActionAttempted] = useState(false);

    if (!isOpen) return null;

    const loading = cartLoading || orderLoading;
    const error = actionAttempted ? (step === 2 ? orderError : cartError) : null;

    // Busca la miniatura en los productos cargados en Redux 
    const getProductImageId = (productId) => {
        const foundInCatalog = products.find((p) => p.id === productId);
        if (foundInCatalog?.imageIds?.length > 0) return foundInCatalog.imageIds[0];
        if (selectedProduct?.id === productId && selectedProduct?.imageIds?.length > 0) {
            return selectedProduct.imageIds[0];
        }
        return null;
    };

    // Sumar 1 unidad (+)
    const handleIncrease = (item) => {
        setActionAttempted(true);
        dispatch(addToCart({ token, productId: item.productId, quantity: 1 }));
    };

    // Restar 1 unidad (-)
    const handleDecrease = (item) => {
        setActionAttempted(true);
        dispatch(removeOneFromCart({ token, productId: item.productId }));
    };

    // Quitar producto completo del carrito
    const handleRemove = (productId) => {
        setActionAttempted(true);
        dispatch(removeFromCart({ token, productId }));
    };

    // Confirmar compra (POST /orders/checkout)
    const handleCheckout = async (e) => {
        e.preventDefault();
        setActionAttempted(true);

        const result = await dispatch(checkoutOrders({ token, paymentMethod, deliveryMethod }));

        if (checkoutOrders.fulfilled.match(result)) {
            setCompletedOrder(result.payload);
            setActionAttempted(false);
            setStep(3);
        }
    };

    const handleCloseModal = () => {
        setStep(1);
        setActionAttempted(false);
        setCompletedOrder(null);
        onClose();
    };

    return (
        <div className="cart-overlay" onClick={handleCloseModal}>
            <div className="cart-modal" onClick={(e) => e.stopPropagation()}>

                {/* 1. Cabecera */}
                <div className="cart-header">
                    <h2 className="cart-title">Tu carrito</h2>
                    <button
                        type="button"
                        className="cart-close-btn"
                        onClick={handleCloseModal}
                        aria-label="Cerrar carrito"
                    >
                        ✕
                    </button>
                </div>

                {/* 2. Barra de progreso de 3 pasos */}
                <div className="cart-stepper">
                    <div className="step-item">
                        <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
                        <span className="step-label">Carrito</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item">
                        <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
                        <span className="step-label">Tus datos</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item">
                        <div className={`step-circle ${step === 3 ? 'active' : ''}`}>3</div>
                        <span className="step-label">Listo</span>
                    </div>
                </div>

                {/* Mensaje de error si ocurre algún problema */}
                {error && <p className="cart-error">{error}</p>}

                {/* --- PASO 1: CARRITO --- */}
                {step === 1 && (
                    <>
                        {!token ? (
                            <div className="cart-empty">
                                <p>Iniciá sesión para armar y ver tu carrito.</p>
                                <button
                                    type="button"
                                    className="cart-btn-primary"
                                    onClick={() => {
                                        handleCloseModal();
                                        navigate('/login');
                                    }}
                                >
                                    Ir a iniciar sesión
                                </button>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="cart-empty">
                                <p>Tu carrito está vacío.</p>
                                <button type="button" className="cart-btn-secondary" onClick={handleCloseModal}>
                                    Ver figuras
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Lista de productos */}
                                <div className="cart-items-list">
                                    {items.map((item) => {
                                        const imageId = getProductImageId(item.productId);
                                        return (
                                            <div key={item.id || item.productId} className="cart-item">
                                                <div className="cart-item-img-box">
                                                    {imageId ? (
                                                        <img
                                                            src={`${IMAGE_URL}${imageId}`}
                                                            alt={item.productName}
                                                            className="cart-item-img"
                                                        />
                                                    ) : (
                                                        <span className="cart-item-placeholder">ゴ</span>
                                                    )}
                                                </div>

                                                <div className="cart-item-info">
                                                    <h3 className="cart-item-name">{item.productName}</h3>
                                                    <p className="cart-item-unit">
                                                        {formatPrice(item.unitPrice)} cada una
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="cart-item-remove"
                                                        disabled={loading}
                                                        onClick={() => handleRemove(item.productId)}
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>

                                                <div className="cart-qty-box">
                                                    <button
                                                        type="button"
                                                        className="cart-qty-btn"
                                                        disabled={loading}
                                                        onClick={() => handleDecrease(item)}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="cart-qty-value">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="cart-qty-btn"
                                                        disabled={loading}
                                                        onClick={() => handleIncrease(item)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Barra de envío gratis */}
                                <div className="cart-shipping-banner">
                                    <p>¡Tenés envío gratis!</p>
                                    <div className="cart-shipping-bar"></div>
                                </div>

                                {/* Resumen de costos */}
                                <div className="cart-summary">
                                    <div className="cart-summary-row">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                    <div className="cart-summary-row">
                                        <span>Envío</span>
                                        <span>Gratis</span>
                                    </div>
                                    <div className="cart-total-row">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="cart-actions">
                                    <button
                                        type="button"
                                        className="cart-btn-secondary"
                                        onClick={handleCloseModal}
                                    >
                                        Seguir comprando
                                    </button>
                                    <button
                                        type="button"
                                        className="cart-btn-primary"
                                        disabled={loading}
                                        onClick={() => {
                                            setActionAttempted(false);
                                            setStep(2);
                                        }}
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* --- PASO 2: TUS DATOS (Método de pago y envío) --- */}
                {step === 2 && (
                    <form className="cart-checkout-form" onSubmit={handleCheckout}>
                        <label className="cart-form-label" htmlFor="payment-method">
                            Medio de pago
                        </label>
                        <select
                            id="payment-method"
                            className="cart-form-select"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="Tarjeta de crédito / débito">Tarjeta de crédito / débito</option>
                            <option value="Transferencia bancaria">Transferencia bancaria</option>
                            <option value="Efectivo en punto de pago">Efectivo en punto de pago</option>
                        </select>

                        <label className="cart-form-label" htmlFor="delivery-method">
                            Forma de entrega
                        </label>
                        <select
                            id="delivery-method"
                            className="cart-form-select"
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                        >
                            <option value="Envío a domicilio gratis">Envío a domicilio (Gratis)</option>
                            <option value="Retiro por sucursal">Retiro por local</option>
                        </select>

                        <div className="cart-total-row">
                            <span>Total a pagar</span>
                            <span>{formatPrice(total)}</span>
                        </div>

                        <div className="cart-actions">
                            <button
                                type="button"
                                className="cart-btn-secondary"
                                disabled={loading}
                                onClick={() => {
                                    setActionAttempted(false);
                                    setStep(1);
                                }}
                            >
                                Volver
                            </button>
                            <button type="submit" className="cart-btn-primary" disabled={loading}>
                                {loading ? 'Procesando...' : 'Confirmar compra'}
                            </button>
                        </div>
                    </form>
                )}

                {/* --- PASO 3: LISTO --- */}
                {step === 3 && completedOrder && (
                    <div className="cart-success">
                        <div className="cart-success-icon">ゴ</div>
                        <h3 className="cart-success-title">¡Pedido confirmado!</h3>
                        <p>
                            Orden <strong>#{completedOrder.id}</strong> registrada con éxito.
                        </p>
                        <p>
                            Medio de pago: <strong>{completedOrder.paymentMethod}</strong>
                        </p>
                        <p>
                            Entrega: <strong>{completedOrder.deliveryMethod}</strong>
                        </p>
                        <div className="cart-total-row">
                            <span>Total abonado</span>
                            <span>{formatPrice(completedOrder.total)}</span>
                        </div>
                        <div className="cart-actions">
                            <button type="button" className="cart-btn-primary" onClick={handleCloseModal}>
                                Listo
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CartModal;