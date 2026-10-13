import { Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import Products from './views/Products'
import Navbar from './components/Navbar'

function App() {
  return (
    <>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </>
  )
}

export default App
