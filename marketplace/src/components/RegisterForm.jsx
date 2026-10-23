import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';
import './RegisterForm.css';

// URL base del backend
const URL = 'http://localhost:8080';

const RegisterForm = ({ onLogin }) => {
    // Sirve para cambiar de página por código (al registrarse volvemos al catálogo)
    const navigate = useNavigate();
    // Lo que se va escribiendo en cada campo
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Tipo de cuenta: BUYER (comprador) o SELLER (vendedor)
    const [role, setRole] = useState('BUYER');
    // Mientras es true el botón queda deshabilitado
    const [loading, setLoading] = useState(false);
    // Mensaje de error que se muestra (null si no hay ninguno)
    const [error, setError] = useState(null);

    // Se ejecuta al enviar el formulario (con Enter o con el botón)
    const handleSubmit = (e) => {
        // Evita que el formulario recargue la página
        e.preventDefault();
        // Las contraseñas se comparan acá, antes de enviar nada al backend
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        setLoading(true);
        setError(null);
        fetch(`${URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username.trim(),
                name: name.trim(),
                surname: surname.trim(),
                email: email.trim(),
                password: password,
                role: role
            })
        })
        .then((response)=> response.json())
        .then((data)=>{
            if (!data.accessToken) {
                // El backend responde 400 cuando el usuario o el email ya existen
                throw new Error(data.message || 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.');
            }
            // El registro ya devuelve el token: le pasamos a App para iniciar sesión y volvemos al catálogo
            onLogin(data.accessToken);
            navigate('/products');
        })
        .catch((error)=>{
            console.error("Error al crear la cuenta: ", error);
            // Si el error lo lanzamos nosotros (trae el mensaje del backend) lo mostramos; si no (servidor caído), uno general
            setError(error.name === 'Error' ? error.message : 'No pudimos crear la cuenta. Revisá los datos y que el servidor esté activo.');
        })
        // finally se ejecuta siempre, haya salido bien o mal
        .finally(()=> setLoading(false));
    };

    return (
        <section className="login-wrapper">
            <div className="login-box">

                {/* 1. Título */}
                <h2 className="login-title">Crear cuenta</h2>

                {/* 2. Formulario */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-label" htmlFor="register-username">Usuario</label>
                    <input
                        id="register-username"
                        type="text"
                        className="login-field"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    {/* Nombre y apellido lado a lado */}
                    <div className="register-row">
                        <div className="register-group">
                            <label className="login-label" htmlFor="register-name">Nombre</label>
                            <input
                                id="register-name"
                                type="text"
                                className="login-field"
                                autoComplete="given-name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="register-group">
                            <label className="login-label" htmlFor="register-surname">Apellido</label>
                            <input
                                id="register-surname"
                                type="text"
                                className="login-field"
                                autoComplete="family-name"
                                required
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                            />
                        </div>
                    </div>

                    <label className="login-label" htmlFor="register-email">Email</label>
                    <input
                        id="register-email"
                        type="email"
                        className="login-field"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label className="login-label" htmlFor="register-password">Contraseña</label>
                    <input
                        id="register-password"
                        type="password"
                        className="login-field"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label className="login-label" htmlFor="register-confirm">Repetir contraseña</label>
                    <input
                        id="register-confirm"
                        type="password"
                        className="login-field"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <label className="login-label" htmlFor="register-role">Tipo de cuenta</label>
                    <select
                        id="register-role"
                        className="login-field"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="BUYER">Comprador</option>
                        <option value="SELLER">Vendedor</option>
                    </select>

                    {/* 3. Mensaje de error */}
                    {error && <p className="login-error" role="alert">{error}</p>}

                    {/* 4. Botón de envío */}
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                {/* 5. Link para quien ya tiene cuenta */}
                <p className="login-switch">¿Ya tenés cuenta? <Link to="/login">Ingresá</Link></p>
            </div>
        </section>
    );
};

export default RegisterForm;
