import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthPage = () => {
  const [params] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register, guestLogin, isAuthenticated, addToast } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (isAuthenticated) navigate('/game') }, [isAuthenticated])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await login(form.email, form.password)
        if (!data.success) throw new Error(data.message)
      } else {
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters')
        const data = await register(form.username, form.email, form.password)
        if (!data.success) throw new Error(data.message)
      }
      navigate('/game')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setLoading(true)
    try {
      await guestLogin()
      navigate('/game')
    } catch {
      setError('Could not start guest session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: 'var(--space-8)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-3)' }}>🧠</div>
          <h1 style={{
            fontSize: 'var(--fs-2xl)', fontWeight: 900,
            background: 'var(--gradient-brand)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 8
          }}>Mind Match</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
            {mode === 'login' ? 'Welcome back, challenger!' : 'Join the cognitive arena'}
          </p>
        </div>

        {/* Tab Switch */}
        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          <button id="tab-login" className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError('') }}>
            Login
          </button>
          <button id="tab-register" className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError('') }}>
            Register
          </button>
        </div>

        {/* Form */}
        <div className="glass" style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username" name="username" className="form-input"
                  placeholder="Your gamer tag…"
                  value={form.username} onChange={handleChange} required
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email" name="email" type="email" className="form-input"
                placeholder="your@email.com"
                value={form.email} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password" className="form-input"
                placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                value={form.password} onChange={handleChange} required
              />
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: 'var(--fs-sm)'
              }}>
                ⚠️ {error}
              </div>
            )}

            <button id="btn-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? '⏳ Please wait…' : (mode === 'login' ? '🚀 Login' : '✨ Create Account')}
            </button>
          </form>

          <div className="divider" />

          <button id="btn-guest" className="btn btn-secondary w-full" onClick={handleGuest} disabled={loading}>
            👤 Continue as Guest
          </button>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            Guest progress is not saved permanently.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          <Link to="/" style={{ color: 'var(--brand-primary)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
