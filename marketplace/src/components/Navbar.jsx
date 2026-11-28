import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, fetchUsers } from './Redux/userSlice';
import { fetchCart } from './Redux/cartSlice';
import { setFilters } from './Redux/productSlice';
import CartModal from './CartModal';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Estados globales desde Redux
    const { token, currentUser } = useSelector((state) => state.user);
    const { items: cartItems } = useSelector((state) => state.cart);
    const role = currentUser?.role;

    // Estados locales solo de UI
    const [searchTerm, setSearchTerm] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartLoaded, setCartLoaded] = useState(false);

    // Cargamos los datos del usuario logueado si hay token y todavía no está en Redux
    useEffect(() => {
        if (token && !currentUser) {
            dispatch(fetchUsers(token));
        }
    }, [token, currentUser, dispatch]);

    // Cargamos el carrito una sola vez al iniciar sesión
    useEffect(() => {
        if (!token) {
            setCartLoaded(false);
            return;
        }
        if (!cartLoaded) {
            dispatch(fetchCart(token));
            setCartLoaded(true);
        }
    }, [token, cartLoaded, dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/home');
    };

    // Actualiza el filtro global de productos y navega al catálogo
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim() !== '') {
            dispatch(setFilters({
                keyword: searchTerm.trim(),
                categoryId: '',
                minPrice: '',
                maxPrice: ''
            }));
            navigate('/products');
            setSearchTerm('');
        }
    };

    const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <nav className="navbar bg-black text-white custom-navbar">
                <div className="nav-section justify-start">
                    <Link to="/home" className="logo-link">
                        <div className="logo-box">
                            <span>ゴ</span>
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">Gogogo</span>
                            <span className="logo-subtitle">MARKET</span>
                        </div>
                    </Link>
                </div>

                <div className="nav-section justify-center hide-on-mobile">
                    <form onSubmit={handleSearchSubmit} className="w-full max-w-lg">
                        <input
                            type="text"
                            placeholder="Buscar personaje o figura..."
                            className="input bg-black text-white search-input w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                </div>

                <div className="nav-section justify-end gap-links">
                    <div className="nav-links">
                        <Link to="/products" className="nav-link">Productos</Link>
                        {token && (role === 'SELLER' || role === 'ADMIN') && <Link to="/sell" className="nav-link">Vender</Link>}
                        {token && <Link to="/profile" className="nav-link">Mi Perfil</Link>}
                        {token && role === 'ADMIN' && <Link to="/admin" className="nav-link">Admin</Link>}
                        <Link to="/how-to-buy" className="nav-link">Cómo comprar</Link>
                        <Link to="/contact" className="nav-link">Contacto</Link>
                    </div>

                    {token ? (
                        <button type="button" className="auth-btn" onClick={handleLogout}>Cerrar sesión</button>
                    ) : (
                        <Link to="/login" className="auth-btn">Ingresar</Link>
                    )}

                    <div className="cart-container">
                        <button
                            type="button"
                            className="btn bg-white text-black cart-btn"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="cart-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Carrito</span>
                        </button>

                        {cartItemsCount > 0 && (
                            <div className="cart-badge bg-black text-white">
                                {cartItemsCount}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </>
    );
};

export default Navbar;