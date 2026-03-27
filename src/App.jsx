import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import CreateIdentity from './pages/CreateIdentity'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import DemoService from './pages/DemoService'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"          element={<Landing />} />
      <Route path="/create"    element={<CreateIdentity />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/demo"      element={<DemoService />} />
    </Routes>
  </BrowserRouter>
)

export default App
