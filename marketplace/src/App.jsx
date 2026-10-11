import { Routes, Route } from 'react-router-dom'
import Home from './views/Home' 
import Navbar from './components/Navbar'

function App() {
  return (
    <>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  )
}

export default App