import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:5000/api'

const AdminPage = () => {
  const { authHeaders, addToast } = useAuth()
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'users'
  const [metrics, setMetrics] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Challenge Form State
  const [challengeTitle, setChallengeTitle] = useState('')
  const [challengeDesc, setChallengeDesc] = useState('')
  const [challengeDiff, setChallengeDiff] = useState('medium')
  const [challengeTime, setChallengeTime] = useState(45)
  const [challengeMoves, setChallengeMoves] = useState(25)
  const [challengeReward, setChallengeReward] = useState(150)
  const [publishing, setPublishing] = useState(false)

  const fetchOverviewData = async () => {
    try {
      const res = await axios.get(`${API}/admin/overview`, authHeaders())
      if (res.data.success) {
        setMetrics(res.data.metrics)
      }
    } catch (err) {
      console.error('Error fetching admin metrics:', err)
      addToast('Failed to load admin metrics.', 'error')
    }
  }

  const fetchUsersData = async () => {
    try {
      const res = await axios.get(`${API}/admin/users`, authHeaders())
      if (res.data.success) {
        setUsers(res.data.users || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      addToast('Failed to load user database.', 'error')
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchOverviewData(), fetchUsersData()])
      setLoading(false)
    }
    init()
  }, [authHeaders])

  const handlePublishChallenge = async (e) => {
    e.preventDefault()
    if (!challengeTitle || !challengeDesc || !challengeTime || !challengeMoves) {
      addToast('Please enter all challenge parameters.', 'warning')
      return
    }

    setPublishing(true)
    try {
      const { data } = await axios.post(`${API}/admin/challenges`, {
        title: challengeTitle,
        description: challengeDesc,
        difficulty: challengeDiff,
        targetTime: challengeTime,
        targetMoves: challengeMoves,
        pointsReward: challengeReward
      }, authHeaders())

      if (data.success) {
        addToast(data.message || 'Challenge published!', 'success')
        // Reset form
        setChallengeTitle('')
        setChallengeDesc('')
        setChallengeDiff('medium')
        setChallengeTime(45)
        setChallengeMoves(25)
        setChallengeReward(150)
        // Refresh overview/metrics in case
        fetchOverviewData()
      }
    } catch (err) {
      console.error('Error publishing challenge:', err)
      addToast(err.response?.data?.message || 'Failed to publish challenge.', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently purge user "${username}"? This cannot be undone.`)) {
      return
    }

    try {
      const { data } = await axios.delete(`${API}/admin/users/${id}`, authHeaders())
      if (data.success) {
        addToast(`Purged user ${username} successfully.`, 'success')
        setUsers(prev => prev.filter(u => u._id !== id))
        fetchOverviewData() // Update counts
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      addToast('Failed to purge user.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="waiting-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Admin Command Center</h1>
        <p className="page-subtitle">Oversee cognitive aggregates, register challenges, and curate the player ecosystem.</p>
      </div>

      {/* Aggregate metrics */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-card-icon">👥</div>
            <div className="stat-card-value">{metrics.totalUsers}</div>
            <div className="stat-card-label">Registered Minds</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🎭</div>
            <div className="stat-card-value">{metrics.totalGuests}</div>
            <div className="stat-card-label">Active Guests</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🌌</div>
            <div className="stat-card-value">{metrics.totalGames}</div>
            <div className="stat-card-label">Total Completed Puzzles</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📐</div>
            <div className="stat-card-value">{metrics.avgAccuracy}%</div>
            <div className="stat-card-label">Average Spatial Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">⏳</div>
            <div className="stat-card-value">{metrics.avgRecall}ms</div>
            <div className="stat-card-label">Average Recall Latency</div>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="tabs" style={{ marginBottom: 24, maxWidth: 400 }}>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🎯 Neural Challenges
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Database ({users.length})
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          {/* Publish challenge form */}
          <div className="glass" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginBottom: 20 }}>Publish Daily Challenge</h3>
            <form onSubmit={handlePublishChallenge} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Challenge Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Quantum Memory Jump"
                  value={challengeTitle}
                  onChange={e => setChallengeTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="e.g., Complete a card matrix focusing on quick recall..."
                  value={challengeDesc}
                  onChange={e => setChallengeDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-input"
                    value={challengeDiff}
                    onChange={e => setChallengeDiff(e.target.value)}
                  >
                    <option value="easy">Easy (4x4)</option>
                    <option value="medium">Medium (6x6)</option>
                    <option value="hard">Hard (8x8)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Points Reward</label>
                  <input
                    type="number"
                    className="form-input"
                    value={challengeReward}
                    onChange={e => setChallengeReward(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Target Time (seconds)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={challengeTime}
                    onChange={e => setChallengeTime(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Moves Limit</label>
                  <input
                    type="number"
                    className="form-input"
                    value={challengeMoves}
                    onChange={e => setChallengeMoves(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={publishing}>
                {publishing ? 'Publishing...' : '🚀 Publish Challenge'}
              </button>
            </form>
          </div>

          {/* Info Card / Instructions */}
          <div className="glass-dark" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 12 }}>Challenge Rules & Analytics</h3>
            <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Challenges remain **active until midnight** of the day they are published.</li>
              <li>Successfully meeting both target moves and time limits rewards the player and advances their daily streak count.</li>
              <li>Points are calculated relative to overall difficulty tiers, with bonus modifiers.</li>
              <li>Aggregate latency and accuracy calculations are powered directly by the neural heuristic game log parser.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* User Database List */
        <div className="glass-dark" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase' }}>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Username</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Email</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Account Type</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Role</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Games Played</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Points</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Registered</th>
                <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u._id} style={{ borderBottom: index < users.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: 'var(--fs-sm)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', color: 'var(--text-muted)' }}>{u.email || 'N/A'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                    <span style={{ fontSize: 'var(--fs-xs)', borderRadius: 'var(--radius-sm)', padding: '1px 6px', background: u.isGuest ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: u.isGuest ? 'var(--brand-danger)' : 'var(--brand-success)' }}>
                      {u.isGuest ? 'Guest' : 'Registered'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', textTransform: 'uppercase', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                    {u.role}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', fontFamily: 'var(--font-mono)' }}>{u.gamesPlayed || 0}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                    {u.points || 0}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'right' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteUser(u._id, u.username)}
                      disabled={u.role === 'admin'}
                    >
                      ☠ Purge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPage
