import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, fetchUsers } from './Redux/userSlice';
import CartModal from './CartModal';
import './Navbar.css';

const URL = 'http://localhost:8080';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // 1. Nos suscribimos al estado global de usuario
    const { token, currentUser } = useSelector((state) => state.user);
    const role = currentUser?.role; // Extraemos el rol directamente

    // Estados locales (el carrito lo migraremos a Redux más adelante)
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // 2. Si hay token pero no tenemos los datos del usuario (ej: al recargar la página con F5), los pedimos
    useEffect(() => {
        if (token && !currentUser) {
            dispatch(fetchUsers());
        }
    }, [token, currentUser, dispatch]);

    // 3. Función de Cerrar Sesión usando Redux
    const handleLogout = () => {
        dispatch(logout());
        navigate('/home');
    };

    // --- LÓGICA TEMPORAL DEL CARRITO (Hasta que creemos el cartSlice) ---
    useEffect(() => {
        if (!token) {
            setCart({ items: [], total: 0 });
            return;
        }
        fetch(`${URL}/carts`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
            if (data) setCart(data);
        })
        .catch((error) => console.error("Error al cargar el carrito: ", error));
    }, [token]);

    useEffect(() => {
        if (location.state?.updatedCart) {
            setCart(location.state.updatedCart);
            if (location.state.openCart) {
                setIsCartOpen(true);
            }
        }
        if (location.state?.removedProductId) {
            setCart((prevCart) => {
                const filteredItems = (prevCart?.items || []).filter(
                    (item) => item.productId !== location.state.removedProductId
                );
                const newTotal = filteredItems.reduce((acc, item) => acc + item.subtotal, 0);
                return { ...prevCart, items: filteredItems, total: newTotal };
            });
        }
    }, [location.state]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim() !== '') {
            navigate('/products', { state: { searchKeyword: searchTerm.trim() } });
            setSearchTerm('');
        }
    };

    const cartItemsCount = (cart?.items || []).reduce((acc, item) => acc + item.quantity, 0);
    const handleCartChange = (newCart) => {
        setCart(newCart);
        navigate(location.pathname, {
            replace: true,
            state: { updatedCart: newCart, timestamp: Date.now() }
        });
    };

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
                cart={cart} 
                setCart={handleCartChange} 
                token={token} 
            />
        </>
    );
};

export default Navbar;