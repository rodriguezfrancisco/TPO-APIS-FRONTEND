import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const cartItemsCount = 2; // Hardcodeado por ahora

    return (
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
                
                {/* Enlaces de Navegación */}
                <div className="nav-links hide-on-mobile">
                    <Link to="/products" className="nav-link">Productos</Link>
                    <Link to="/how-to-buy" className="nav-link">Cómo comprar</Link>
                    <Link to="/contact" className="nav-link">Contacto</Link>
                </div>

                {/* Contenedor del carrito */}
                <div className="cart-container">
                    <Link to="/cart" className="btn bg-white text-black cart-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" className="cart-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Carrito</span>
                    </Link>
                    
                    {/* Badge numérico */}
                    {cartItemsCount > 0 && (
                        <div className="cart-badge bg-black text-white">
                            {cartItemsCount}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;