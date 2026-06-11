import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: '🧠', title: 'AI Cognitive Analysis', desc: 'Our AI engine tracks spatial accuracy, attention focus, and memory recall patterns after every game.' },
  { icon: '⚔️', title: 'Real-Time Multiplayer', desc: 'Challenge friends in live 1v1 rooms or jump into Quick Match to find an instant opponent.' },
  { icon: '📊', title: 'Personal Dashboard', desc: 'Track your cognitive growth over time with trend charts, streaks, and achievement badges.' },
  { icon: '🏆', title: 'Global Leaderboard', desc: 'Compete worldwide across Easy, Medium, and Hard difficulty tiers.' },
]

const LandingPage = () => {
  const { isAuthenticated, guestLogin, addToast } = useAuth()
  const navigate = useNavigate()

  const handleGuest = async () => {
    try {
      await guestLogin()
      navigate('/game')
    } catch {
      addToast('Could not start guest session', 'error')
    }
  }

  return (
    <div className="page-content" style={{ paddingTop: 'var(--space-16)' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto var(--space-16)' }}>
        <div style={{ fontSize: '6rem', marginBottom: 'var(--space-6)', animation: 'float-orb 4s ease-in-out infinite alternate' }}>
          🧠
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, var(--fs-hero))',
          fontWeight: 900,
          background: 'var(--gradient-brand)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 'var(--space-6)', lineHeight: 1.1
        }}>
          Train Your Mind.<br />Master the Grid.
        </h1>
        <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', lineHeight: 1.6 }}>
          A premium memory card game with real-time multiplayer, AI-powered cognitive diagnostics,
          and a global leaderboard. How sharp is your mind?
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/game')}>
                🎮 Play Now
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/multiplayer')}>
                ⚔️ Multiplayer
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                🚀 Get Started Free
              </Link>
              <button className="btn btn-secondary btn-lg" onClick={handleGuest}>
                👤 Play as Guest
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="glass" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-6)', padding: 'var(--space-8)',
        marginBottom: 'var(--space-16)', textAlign: 'center'
      }}>
        {[
          { value: '3', label: 'Difficulty Tiers' },
          { value: '5+', label: 'AI Metrics Tracked' },
          { value: '∞', label: 'Replayability' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 'var(--fs-4xl)', fontWeight: 900, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {s.value}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-8)', fontSize: 'var(--fs-2xl)', color: 'var(--text-primary)' }}>
          Why Mind Match?
        </h2>
        <div className="grid-2">
          {features.map((f, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>{f.icon}</div>
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 'var(--fs-sm)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Preview */}
      <div className="glass" style={{ padding: 'var(--space-10)', marginBottom: 'var(--space-16)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Choose Your Challenge</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>Three grid sizes, one goal — find all the pairs.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: '🟢 Easy', sub: '4×4 Grid — 8 Cards', desc: 'Perfect for warm-up' },
            { label: '🟡 Medium', sub: '6×6 Grid — 16 Cards', desc: 'The sweet spot' },
            { label: '🔴 Hard', sub: '8×8 Grid — 24 Cards', desc: 'Elite memory required' },
          ].map((d, i) => (
            <div key={i} className="difficulty-btn" style={{ maxWidth: 200, cursor: 'default' }}>
              <span className="diff-icon">{d.label}</span>
              <div style={{ fontWeight: 700 }}>{d.sub}</div>
              <div className="diff-grid">{d.desc}</div>
            </div>
          ))}
        </div>
        <Link to={isAuthenticated ? '/game' : '/auth'} className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-8)' }}>
          Start Playing →
        </Link>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingBottom: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
        🧠 Mind Match — Built with React + Express + Socket.io · AI-powered cognitive diagnostics
      </div>
    </div>
  )
}

export default LandingPage
