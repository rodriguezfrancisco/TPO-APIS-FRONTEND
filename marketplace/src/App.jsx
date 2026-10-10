import { Routes, Route } from 'react-router-dom'
import Home from './views/Home' 

function App() {
  return (
    <>
      {/* Acá irá el Navbar más adelante */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  )
}

export default App