import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser } from './Redux/userSlice';
import { fetchOrders } from './Redux/orderSlice';
import './UserProfile.css';

const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price || 0);
};

const UserProfile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token, currentUser, loading, error } = useSelector((state) => state.user);
    const { items: orders } = useSelector((state) => state.order);

    // Por si el backend devuelve 204 (sin contenido) al no tener compras todavía
    const orderList = Array.isArray(orders) ? orders : [];

    // Estados locales del formulario
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');

    // Mensajes de feedback/validación y control para no repetir el GET de órdenes al editar
    const [validationError, setValidationError] = useState(null);
    const [message, setMessage] = useState(null);
    const [ordersLoaded, setOrdersLoaded] = useState(false);

    // Etapa de montaje: verificamos sesión y traemos perfil (si falta) y órdenes una sola vez
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        if (!currentUser) {
            dispatch(fetchUsers(token));
        }
        if (!ordersLoaded) {
            dispatch(fetchOrders(token));
            setOrdersLoaded(true);
        }
    }, [token, currentUser, ordersLoaded, dispatch, navigate]);

    // Sincronizamos los inputs con los datos actuales del usuario en Redux
    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setName(currentUser.name || '');
            setSurname(currentUser.surname || '');
            setEmail(currentUser.email || '');
        }
    }, [currentUser]);

    // Etapa de actualización: PATCH mediante Redux
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setValidationError(null);
        setMessage(null);

        const changes = {
            username: username.trim(),
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim()
        };

        if (password.trim() !== '') {
            if (currentPassword.trim() === '') {
                setValidationError('Debés ingresar tu contraseña actual para cambiarla.');
                return;
            }
            if (password.length < 8) {
                setValidationError('La nueva contraseña debe tener al menos 8 caracteres.');
                return;
            }
            changes.currentPassword = currentPassword;
            changes.password = password;
        }

        const result = await dispatch(updateUser({ token, id: currentUser.id, changes }));

        if (updateUser.fulfilled.match(result)) {
            setCurrentPassword('');
            setPassword('');
            setMessage('Perfil actualizado correctamente.');
        }
    };

    const errorMessage = validationError || error;

    return (
        <section className="profile-wrapper">
            <div className="profile-container">
                <h2 className="profile-main-title">Mi Perfil</h2>

                {loading && !currentUser && <p className="profile-status-box">Cargando perfil...</p>}
                {!loading && error && !currentUser && <p className="profile-status-box">{error}</p>}

                {currentUser && (
                    <div className="profile-grid">

                        {/* Columna Izquierda: Datos y edición */}
                        <div className="profile-card">
                            <div className="profile-header">
                                <div className="profile-avatar">ゴ</div>
                                <div>
                                    <h3 className="profile-username">@{currentUser.username}</h3>
                                    <span className="profile-role-badge">{currentUser.role}</span>
                                </div>
                            </div>

                            {(currentUser.role === 'SELLER' || currentUser.role === 'ADMIN') && (
                                <Link to="/sell" className="profile-seller-cta">
                                    Ir a mi Panel de Vendedor →
                                </Link>
                            )}

                            <form className="profile-form" onSubmit={handleUpdateProfile}>
                                <label className="profile-label" htmlFor="prof-username">Usuario</label>
                                <input
                                    id="prof-username"
                                    type="text"
                                    className="profile-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />

                                <div className="profile-row">
                                    <div className="profile-field-group">
                                        <label className="profile-label" htmlFor="prof-name">Nombre</label>
                                        <input
                                            id="prof-name"
                                            type="text"
                                            className="profile-input"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="profile-field-group">
                                        <label className="profile-label" htmlFor="prof-surname">Apellido</label>
                                        <input
                                            id="prof-surname"
                                            type="text"
                                            className="profile-input"
                                            value={surname}
                                            onChange={(e) => setSurname(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <label className="profile-label" htmlFor="prof-email">Email</label>
                                <input
                                    id="prof-email"
                                    type="email"
                                    className="profile-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <label className="profile-label" htmlFor="prof-curr-pass">
                                    Contraseña actual (solo para cambiarla)
                                </label>
                                <input
                                    id="prof-curr-pass"
                                    type="password"
                                    className="profile-input"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />

                                <label className="profile-label" htmlFor="prof-pass">
                                    Nueva contraseña (opcional)
                                </label>
                                <input
                                    id="prof-pass"
                                    type="password"
                                    className="profile-input"
                                    placeholder="Dejar en blanco para mantener la actual"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                {errorMessage && <p className="profile-status-box">{errorMessage}</p>}
                                {message && <p className="profile-success-box">{message}</p>}

                                <button type="submit" className="profile-btn" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </form>
                        </div>

                        {/* Columna Derecha: Historial de compras */}
                        <div className="profile-card">
                            <h3 className="profile-section-title">Mis Compras</h3>
                            {orderList.length === 0 ? (
                                <p className="profile-status-box">Todavía no realizaste ninguna compra.</p>
                            ) : (
                                <div className="profile-orders-list">
                                    {orderList.map((order) => (
                                        <div key={order.id} className="profile-order-item">
                                            <div className="profile-order-top">
                                                <span className="profile-order-id">Orden #{order.id}</span>
                                                <span className="profile-order-date">{order.date}</span>
                                            </div>
                                            <p className="profile-order-detail">
                                                Pago: <strong>{order.paymentMethod}</strong>
                                            </p>
                                            <p className="profile-order-detail">
                                                Entrega: <strong>{order.deliveryMethod}</strong>
                                            </p>
                                            <div className="profile-order-total">
                                                <span>Total</span>
                                                <span>{formatPrice(order.total)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </section>
    );
};

export default UserProfile;