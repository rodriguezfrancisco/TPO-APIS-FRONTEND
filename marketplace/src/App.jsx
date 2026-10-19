import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Products from './views/Products';
import Navbar from './components/Navbar';
import Login from './views/Login';
import Product from './views/Product';
import Register from './views/Register';
import Profile from './views/Profile';
import Sell from './views/Sell';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('jwtToken', newToken);
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('jwtToken');
  };

  return (
    <>
      <Navbar token={token} onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onLogin={login} />} />
        <Route path="/profile" element={<Profile onLogin={login} />} />
        <Route path="/sell" element={<Sell />} />
      </Routes>
    </>
  );
}

export default App;