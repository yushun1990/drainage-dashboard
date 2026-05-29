import { Routes, Route } from 'react-router-dom'
import { DashboardShell } from './components/layout/DashboardShell'
import { AdminShell } from './components/admin/AdminShell'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardShell />} />
      <Route path="/admin/*" element={<AdminShell />} />
    </Routes>
  )
}

export default App
