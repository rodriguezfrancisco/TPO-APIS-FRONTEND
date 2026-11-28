import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser } from './Redux/userSlice';
import './AdminUsers.css';

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
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token, currentUser, items: users, loading, error } = useSelector((state) => state.user);

    // Mensaje de éxito después de cambiar un rol
    const [feedback, setFeedback] = useState(null);
    // Rol elegido en el selector de cada usuario, todavía sin guardar: { idDelUsuario: 'ROL' }
    const [selectedRoles, setSelectedRoles] = useState({});

    // Si no hay sesión mandamos al login; si todavía no se cargó la lista de usuarios, la pedimos
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        if (users.length === 0) {
            dispatch(fetchUsers(token));
        }
    }, [token, users.length, dispatch, navigate]);

    // Cambia el rol de un usuario (PATCH /users/{id}) mediante Redux
    const handleChangeRole = async (userId, newRole) => {
        setFeedback(null);

        const result = await dispatch(updateUser({
            token,
            id: userId,
            changes: { role: newRole }
        }));

        if (updateUser.fulfilled.match(result)) {
            const updatedUser = result.payload.user;
            setFeedback(`El rol de "${updatedUser.username}" ahora es ${roleLabel(updatedUser.role)}.`);
        }
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
                {loading && users.length === 0 && <p className="admin-message">Cargando usuarios...</p>}
                {error && <p className="admin-message" role="alert">{error}</p>}
                {feedback && <p className="admin-feedback" role="status">{feedback}</p>}

                {/* 3. Lista de usuarios con el selector de rol */}
                {users.length > 0 && (
                    <>
                        <p className="admin-count">{users.length} {users.length === 1 ? 'usuario' : 'usuarios'}</p>
                        <div className="admin-list">
                            {users.map((user) => {
                                const selectedRole = selectedRoles[user.id] || user.role;
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

                                        {/* Selector de rol y botón */}
                                        <select
                                            className="admin-field"
                                            aria-label={`Rol de ${user.username}`}
                                            value={selectedRole}
                                            disabled={isSelf || loading}
                                            onChange={(e) => setSelectedRoles({ ...selectedRoles, [user.id]: e.target.value })}
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="admin-btn"
                                            disabled={loading || isSelf || selectedRole === user.role}
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