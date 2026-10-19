import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import Products from './views/Products'
import Navbar from './components/Navbar'
import Login from './views/Login'
import Product from './views/Product'
import Register from './views/Register'

function App() {
  // Inicializamos el estado del token buscando si ya hay uno guardado en el navegador
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');

  // Función que se ejecuta cuando el usuario se loguea o registra exitosamente
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('jwtToken', newToken);
  };

  // Función que se ejecuta cuando el usuario hace clic en "Cerrar sesión" en la Navbar
  const logout = () => {
    setToken('');
    localStorage.removeItem('jwtToken');
  };

  return (
    <>
      {/* Le pasamos el token y la función logout a la Navbar para que cambie sus botones dinámicamente */}
      <Navbar token={token} onLogout={logout} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Product />} />
        {/* Ahora sí, la función 'login' existe y se la pasamos correctamente */}
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onLogin={login} />} />
      </Routes>
    </>
  )
}

export default App