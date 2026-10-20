
import { Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Products from './views/Products';
import Navbar from './components/Navbar';
import Login from './views/Login';
import Product from './views/Product';
import Register from './views/Register';
import Profile from './views/Profile';
import Sell from './views/Sell';
import HowToBuy from './views/HowToBuy';
import Contact from './views/Contact';
import useLoginToken from './components/UseLoginToken';

function App() {
  const { token, login, logout } = useLoginToken();
  
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
        <Route path="/how-to-buy" element={<HowToBuy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </>
  );
}

export default App;