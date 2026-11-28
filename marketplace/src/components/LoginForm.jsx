import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import './LoginForm.css';

const LoginForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Solo manejamos localmente lo que el usuario tipea
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Traemos los estados globales desde Redux
    const { loading, error, token } = useSelector((state) => state.user);

    // Redirigir automáticamente si el token se actualiza (login exitoso)
    useEffect(() => {
        if (token) {
            navigate('/products');
        }
    }, [token, navigate]);


    const handleSubmit = (e) => {
        e.preventDefault();
        // Despachamos la acción asíncrona enviando las credenciales
        dispatch(loginUser({ email: email.trim(), password }));
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

                    {/* 3. Mensaje de error. Ahora viene directo de Redux */}
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
