import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UserProfile.css';

const URL = 'http://localhost:8080';

// Función para extraer el usuario (subject) del payload del JWT
const getUsernameFromToken = (token) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const payload = JSON.parse(decodedJson);
        return payload.sub;
    } catch {
        return null;
    }
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(price || 0);
};

const UserProfile = ({ onLogin }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('jwtToken');

    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Estados locales del formulario
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Etapa de montaje: cargamos los datos del usuario y su historial de órdenes
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const currentSub = getUsernameFromToken(token);

        fetch(`${URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => response.json())
        .then((data) => {
            const list = data.content || [];
            const foundUser = list.find(
                (u) => u.username === currentSub || u.email === currentSub
            );

            if (!foundUser) {
                throw new Error('No se encontró el perfil del usuario.');
            }

            setUser(foundUser);
            setUsername(foundUser.username);
            setName(foundUser.name);
            setSurname(foundUser.surname);
            setEmail(foundUser.email);
        })
        .catch((err) => {
            console.error('Error al cargar perfil:', err);
            setError('No pudimos cargar los datos de tu perfil.');
        })
        .finally(() => setLoading(false));

        // Cargamos las órdenes del usuario
        fetch(`${URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
            if (response.status === 204) return [];
            return response.ok ? response.json() : [];
        })
        .then((ordersData) => {
            if (Array.isArray(ordersData)) {
                setOrders(ordersData);
            }
        })
        .catch((err) => console.error('Error al cargar órdenes:', err));
    }, [token, navigate]);

    // Etapa de actualización: PATCH sin hacer GET posterior
    const handleUpdateProfile = (e) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);
        setMessage(null);

        const bodyToSend = {
            username: username.trim(),
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim()
        };

        if (password.trim() !== '') {
            bodyToSend.password = password;
        }

        fetch(`${URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(bodyToSend)
        })
        .then((response) => {
             if (!response.ok) {
                return response.json()
                .catch(() => ({}))
                .then((data) => { throw new Error(data.message || 'El usuario o email ya está en uso.'); });
            }
            return response.json();
        })
        .then((data) => {
            // Actualizamos el estado local con la respuesta del backend
            setUser(data.user);
            setPassword('');
            setMessage('Perfil actualizado correctamente.');

            // Actualizamos el token en App/localStorage porque el backend genera uno nuevo
            if (data.accessToken && onLogin) {
                onLogin(data.accessToken);
            }
        })
        .catch((err) => setError(err.name === 'Error' ? err.message : 'No pudimos completar la acción. Revisá que el servidor esté activo y que tu sesión siga iniciada.'))
        .finally(() => setSaving(false));
    };

    return (
        <section className="profile-wrapper">
            <div className="profile-container">
                <h2 className="profile-main-title">Mi Perfil</h2>

                {loading && <p className="profile-status-box">Cargando perfil...</p>}
                {!loading && error && !user && <p className="profile-status-box">{error}</p>}

                {!loading && user && (
                    <div className="profile-grid">
                        
                        {/* Columna Izquierda: Datos y edición */}
                        <div className="profile-card">
                            <div className="profile-header">
                                <div className="profile-avatar">ゴ</div>
                                <div>
                                    <h3 className="profile-username">@{user.username}</h3>
                                    <span className="profile-role-badge">{user.role}</span>
                                </div>
                            </div>

                            {(user.role === 'SELLER' || user.role === 'ADMIN') && (
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

                                {error && <p className="profile-status-box">{error}</p>}
                                {message && <p className="profile-success-box">{message}</p>}

                                <button type="submit" className="profile-btn" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </form>
                        </div>

                        {/* Columna Derecha: Historial de compras */}
                        <div className="profile-card">
                            <h3 className="profile-section-title">Mis Compras</h3>
                            {orders.length === 0 ? (
                                <p className="profile-status-box">Todavía no realizaste ninguna compra.</p>
                            ) : (
                                <div className="profile-orders-list">
                                    {orders.map((order) => (
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
