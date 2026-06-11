import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const avatarEmojis = ['🧠','🦊','🐉','👾','🎭','🦁','🌙','⚡']
  const avatarNum = user?.avatarSeed ? parseInt(user.avatarSeed.replace('avatar-','')) - 1 : 0
  const avatarEmoji = avatarEmojis[avatarNum % avatarEmojis.length] || '🧠'

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span>🧠</span> Mind Match
      </NavLink>

      <div className="navbar-links">
        <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          🏆 Leaderboard
        </NavLink>
        {isAuthenticated && (
          <>
            <NavLink to="/game" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              🎮 Solo Game
            </NavLink>
            <NavLink to="/multiplayer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              ⚔️ Multiplayer
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              📊 Dashboard
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                ⚙️ Admin
              </NavLink>
            )}
          </>
        )}
      </div>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ gap: '8px' }}
              onClick={() => setMenuOpen(o => !o)}
            >
              <span>{avatarEmoji}</span>
              <span>{user?.username}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▼</span>
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 2000,
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)', padding: '8px', minWidth: '160px',
                boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                {user?.stats && (
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Points</div>
                    <div style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>⭐ {user.stats.points?.toLocaleString()}</div>
                  </div>
                )}
                <button className="nav-link" style={{ textAlign: 'left', width: '100%' }} onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}>
                  📊 Dashboard
                </button>
                <button className="nav-link" style={{ textAlign: 'left', width: '100%', color: 'var(--brand-danger)' }} onClick={handleLogout}>
                  👋 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <NavLink to="/auth" className="btn btn-secondary btn-sm">Login</NavLink>
            <NavLink to="/auth?mode=register" className="btn btn-primary btn-sm">Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
