import { Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import Products from './views/Products'
import Navbar from './components/Navbar'
import Product from './views/Product'

function App() {
  return (
    <>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Product />} />
      </Routes>
    </>
  )
}

export default App
