import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from './Redux/userSlice';
import './LoginForm.css';
import './RegisterForm.css';

const RegisterForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estado global desde Redux
    const { token, loading, error } = useSelector((state) => state.user);

    // Estados locales de los inputs del formulario
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('BUYER');

    // Error de validación local y bandera para saber si se envió este formulario
    const [validationError, setValidationError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    // Si el registro fue exitoso, el token se carga en Redux y redirigimos al catálogo
    useEffect(() => {
        if (token) {
            navigate('/products');
        }
    }, [token, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setValidationError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Las contraseñas no coinciden.');
            return;
        }

        setValidationError(null);
        setSubmitted(true);

        dispatch(registerUser({
            username: username.trim(),
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim(),
            password,
            role
        }));
    };

    const errorMessage = validationError || (submitted ? error : null);

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
                    {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}

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