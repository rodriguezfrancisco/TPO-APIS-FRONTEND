import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';

// URL base del backend
const URL = 'http://localhost:8080';

const LoginForm = ({ onLogin }) => {
    // Sirve para cambiar de página por código (al iniciar sesión volvemos al catálogo)
    const navigate = useNavigate();
    // Lo que se va escribiendo en cada campo
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Mientras es true el botón queda deshabilitado
    const [loading, setLoading] = useState(false);
    // Pasa a true si falla el inicio de sesión
    const [error, setError] = useState(null);

    // Se ejecuta al enviar el formulario (con Enter o con el botón)
    const handleSubmit = (e) => {
        // Evita que el formulario recargue la página
        e.preventDefault();
        setLoading(true);
        setError(null);
        // El backend acepta tanto el email como el nombre de usuario en el campo email
        fetch(`${URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password: password })
        })
        .then((response)=> response.json())
        .then((data)=>{
            // Si no vuelve el token (datos incorrectos o error del servidor) saltamos al catch
            if (!data.accessToken) {
                // Con datos incorrectos el backend solo responde 403 (Forbidden): ahí avisamos nosotros
                throw new Error(data.status === 403 || !data.message ? 'Usuario o contraseña incorrectos.' : data.message);
            }
            onLogin(data.accessToken);
            navigate('/products');
        })
        .catch((error)=>{
            console.error("Error al iniciar sesion: ", error);
            // Si el error lo lanzamos nosotros (trae el mensaje del backend) lo mostramos; si no (servidor caído), uno general
            setError(error.name === 'Error' ? error.message : 'No pudimos iniciar sesión. Revisá tus datos y que el servidor esté activo.');
        })
        // finally se ejecuta siempre, haya salido bien o mal
        .finally(()=> setLoading(false));
    };

    return (
        <section className="login-wrapper">
            <div className="login-box">

                {/* 1. Título */}
                <h2 className="login-title">Iniciar sesión</h2>

                {/* 2. Formulario */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-label" htmlFor="login-email">Email o usuario</label>
                    <input
                        id="login-email"
                        type="text"
                        className="login-field"
                        autoComplete="username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label className="login-label" htmlFor="login-password">Contraseña</label>
                    <input
                        id="login-password"
                        type="password"
                        className="login-field"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* 3. Mensaje de error */}
                    {error && <p className="login-error" role="alert">{error}</p>}

                    {/* 4. Botón de envío */}
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                {/* 5. Link para quien todavía no tiene cuenta */}
                <p className="login-switch">¿No tenés cuenta? <Link to="/register">Registrate</Link></p>
            </div>
        </section>
    );
};

export default LoginForm;
