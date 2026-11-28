import { Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Products from './views/Products';
import Navbar from './components/Navbar';
import Login from './views/Login';
import Product from './views/Product';
import Register from './views/Register';
import Profile from './views/Profile';
import Sell from './views/Sell';
import Admin from './views/Admin';
import NotFound from './views/NotFound';
import HowToBuy from './views/HowToBuy';
import Contact from './views/Contact';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/how-to-buy" element={<HowToBuy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
