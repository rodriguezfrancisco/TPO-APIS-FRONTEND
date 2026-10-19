import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CartModal from './CartModal';
import './Navbar.css';

const URL = 'http://localhost:8080';

const Navbar = ({ token, onLogout }) => {
    const location = useLocation();
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // 1. Etapa de montaje / cambio de usuario: traemos el carrito con GET una sola vez
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

    // 2. Si Catalog o ProductDetail agregaron un producto, recibimos el carrito ya actualizado
    // sin necesidad de hacer otro GET al backend
    useEffect(() => {
        if (location.state?.updatedCart) {
            setCart(location.state.updatedCart);
            if (location.state.openCart) {
                setIsCartOpen(true);
            }
        }
    }, [location.state]);

    const cartItemsCount = (cart?.items || []).reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <nav className="navbar bg-black text-white custom-navbar">
                
                {/* 1. Sección Izquierda (Logo) */}
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

                {/* 2. Sección Centro (Buscador) */}
                <div className="nav-section justify-center hide-on-mobile">
                    <input 
                        type="text" 
                        placeholder="Buscar personaje o figura..." 
                        className="input bg-black text-white search-input" 
                    />
                </div>

                {/* 3. Sección Derecha (Navegación y Carrito) */}
                <div className="nav-section justify-end gap-links">
                    
                    <div className="nav-links hide-on-mobile">
                        <Link to="/products" className="nav-link">Productos</Link>
                        <Link to="/how-to-buy" className="nav-link">Cómo comprar</Link>
                        <Link to="/contact" className="nav-link">Contacto</Link>
                    </div>

                    {token ? (
                        <button type="button" className="auth-btn" onClick={onLogout}>Cerrar sesión</button>
                    ) : (
                        <Link to="/login" className="auth-btn">Ingresar</Link>
                    )}

                    {/* Botón que abre el modal del carrito */}
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

            {/* Modal del carrito controlado por la Navbar */}
            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                setCart={setCart}
                token={token}
            />
        </>
    );
};

export default Navbar;