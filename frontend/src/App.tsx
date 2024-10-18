import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ModeratorDashboard from './pages/ModeratorDashboard'
import UserDashboard from './pages/UserDashboard'
import ResetPassword from './pages/ResetPassword'

interface User {
  id: number;
  username: string;
  roles: string[];
}

function App() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogin = (userId: number, username: string, roles: string[]) => {
    setUser({ id: userId, username, roles })
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <Router>
      <div>
        <h1>My App</h1>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/dashboard" element={
            user ? (
              user.roles.includes('ADMIN') ? <AdminDashboard user={user} onLogout={handleLogout} /> :
              user.roles.includes('MODERATOR') ? <ModeratorDashboard user={user} onLogout={handleLogout} /> :
              <UserDashboard user={user} onLogout={handleLogout} />
            ) : <Navigate to="/login" replace />
          } />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App