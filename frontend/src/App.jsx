import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Simulador from './pages/Simulador'

import SidebarLayout from './components/SidebarLayout'
import Alumnos from './pages/Alumnos'
import Planes from './pages/Planes'
import Egresados from './pages/Egresados'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route element={<SidebarLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/egresados" element={<Egresados />} />
        </Route>

        <Route path="/simulador" element={<Simulador />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
