import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminUsers.css';

// URL base del backend
const URL = 'http://localhost:8080';

// Función para extraer el usuario (subject) del payload del JWT
const getUsernameFromToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1])).sub;
    } catch {
        return null;
    }
};

// Roles que se pueden asignar (el value es el texto que espera el backend)
const ROLES = [
    { value: 'BUYER', label: 'Comprador' },
    { value: 'SELLER', label: 'Vendedor' },
    { value: 'ADMIN', label: 'Administrador' }
];

// Devuelve el nombre en castellano de un rol (ej: SELLER -> Vendedor)
const roleLabel = (role) => {
    const found = ROLES.find((r) => r.value === role);
    return found ? found.label : role;
};

const AdminUsers = () => {
    const navigate = useNavigate();
    // El token lo guarda el login en localStorage
    const token = localStorage.getItem('jwtToken');

    // Usuario que tiene la sesión iniciada (para saber si es ADMIN)
    const [currentUser, setCurrentUser] = useState(null);
    // Todos los usuarios que devuelve el backend
    const [users, setUsers] = useState([]);
    // Mientras es true se muestra "Cargando usuarios..."
    const [loading, setLoading] = useState(true);
    // Mensaje de error (null si no hay ninguno)
    const [error, setError] = useState(null);
    // Mensaje de éxito después de cambiar un rol (null si no hay ninguno)
    const [feedback, setFeedback] = useState(null);
    // Rol elegido en el selector de cada usuario, todavía sin guardar: { idDelUsuario: 'ROL' }
    const [selectedRoles, setSelectedRoles] = useState({});

    // Al abrir la pantalla traemos todos los usuarios (GET /users)
    useEffect(() => {
        // Sin sesión no hay nada que mostrar: mandamos al login
        if (!token) {
            navigate('/login');
            return;
        }
        fetch(`${URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => response.json())
        .then((data) => {
            // Si no vienen los usuarios (por ejemplo, token vencido) lanzamos el mensaje que mandó el backend
            if (!data.content) {
                throw new Error(data.message || 'No pudimos cargar los usuarios.');
            }
            setUsers(data.content);
            // Buscamos en la lista al usuario que tiene la sesión iniciada
            const sub = getUsernameFromToken(token);
            const foundUser = data.content.find((u) => u.username === sub || u.email === sub);
            setCurrentUser(foundUser || null);
            setError(null);
        })
        .catch((err) => {
            console.error("Error al cargar los usuarios: ", err);
            // Si el error lo lanzamos nosotros (trae el mensaje del backend) lo mostramos; si no (servidor caído), uno general
            setError(err.name === 'Error' ? err.message : 'No pudimos cargar los usuarios. Revisá que el servidor esté activo y que tu sesión siga iniciada.');
        })
        // finally se ejecuta siempre, haya salido bien o mal
        .finally(() => setLoading(false));
    }, [token, navigate]);

    // Cambia el rol de un usuario (PATCH /users/{id})
    const handleChangeRole = (userId, newRole) => {
        setError(null);
        setFeedback(null);
        fetch(`${URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        })
        .then((response) => response.json())
        .then((data) => {
            // Si no vuelve el usuario actualizado, lanzamos el mensaje que mandó el backend
            if (!data.user) {
                throw new Error(data.message || 'No pudimos cambiar el rol.');
            }
            // El backend también devuelve un token, pero es el de la cuenta modificada: no lo guardamos
            // Reemplazamos al usuario en la lista usando .map() (sin hacer otro GET)
            setUsers(users.map((u) => (u.id === userId ? data.user : u)));
            setFeedback(`El rol de "${data.user.username}" ahora es ${roleLabel(data.user.role)}.`);
        })
        .catch((err) => {
            console.error("Error al cambiar el rol: ", err);
            setError(err.name === 'Error' ? err.message : 'No pudimos completar la acción. Revisá que el servidor esté activo y que tu sesión siga iniciada.');
        });
    };

    // Si el usuario logueado no es administrador, no mostramos la gestión
    if (!loading && currentUser && currentUser.role !== 'ADMIN') {
        return (
            <section className="admin-wrapper">
                <div className="admin-container">
                    <h2 className="admin-title">Administración de usuarios</h2>
                    <p className="admin-message">Solo los administradores pueden gestionar usuarios.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="admin-wrapper">
            <div className="admin-container">

                {/* 1. Título */}
                <h2 className="admin-title">Administración de usuarios</h2>

                {/* 2. Mensajes de estado (cargando, error y éxito) */}
                {loading && <p className="admin-message">Cargando usuarios...</p>}
                {error && <p className="admin-message" role="alert">{error}</p>}
                {feedback && <p className="admin-feedback" role="status">{feedback}</p>}

                {/* 3. Lista de usuarios con el selector de rol */}
                {!loading && users.length > 0 && (
                    <>
                        <p className="admin-count">{users.length} {users.length === 1 ? 'usuario' : 'usuarios'}</p>
                        <div className="admin-list">
                            {users.map((user) => {
                                // Rol que muestra el selector: el elegido sin guardar o, si no eligió nada, el actual
                                const selectedRole = selectedRoles[user.id] || user.role;
                                // Tu propia cuenta no se puede cambiar para no quedarte sin acceso
                                const isSelf = currentUser !== null && currentUser.id === user.id;

                                return (
                                    <div className="admin-row" key={user.id}>
                                        {/* Datos de la cuenta */}
                                        <div className="admin-user">
                                            <span className="admin-user-name">
                                                {user.username} {isSelf && <span className="admin-self">(vos)</span>}
                                            </span>
                                            <span className="admin-user-sub">{user.name} {user.surname}</span>
                                        </div>
                                        <span className="admin-email">{user.email}</span>

                                        {/* Selector de rol y botón: se habilita solo si el rol elegido es distinto al actual */}
                                        <select
                                            className="admin-field"
                                            aria-label={`Rol de ${user.username}`}
                                            value={selectedRole}
                                            disabled={isSelf}
                                            onChange={(e) => setSelectedRoles({ ...selectedRoles, [user.id]: e.target.value })}
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="admin-btn"
                                            disabled={isSelf || selectedRole === user.role}
                                            onClick={() => handleChangeRole(user.id, selectedRole)}
                                        >
                                            Guardar rol
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default AdminUsers;
