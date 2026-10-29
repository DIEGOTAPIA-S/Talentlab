import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Simulador from './pages/Simulador'

import SidebarLayout from './components/SidebarLayout'
import StudentLayout from './components/StudentLayout'
import Alumnos from './pages/Alumnos'
import Planes from './pages/Planes'
import Egresados from './pages/Egresados'
import Mentorias from './pages/Mentorias'
import ReporteEstudiante from './pages/ReporteEstudiante'
import Perfil from './pages/Perfil'
import Consolidado from './pages/Consolidado'
import AdminUsuarios from './pages/AdminUsuarios'

function ProfileLayout() {
  const session = JSON.parse(localStorage.getItem('user_session') || '{}')
  return session.role === 'student' ? <StudentLayout /> : <SidebarLayout />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin & Directivo Routes */}
        <Route element={<SidebarLayout />}>
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/egresados" element={<Egresados />} />
          <Route path="/consolidado" element={<Consolidado />} />
        </Route>

        {/* Perfil: el layout depende del rol */}
        <Route element={<ProfileLayout />}>
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        {/* Protected Student Routes */}
        <Route element={<StudentLayout />}>
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/mentorias" element={<Mentorias />} />
          <Route path="/mi-reporte" element={<ReporteEstudiante />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
