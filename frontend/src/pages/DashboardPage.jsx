import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = 'https://mind-match-s0na.onrender.com/api'

const DashboardPage = () => {
  const { user, authHeaders, addToast } = useAuth()
  const navigate = useNavigate()
  const [statsData, setStatsData] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get(`${API}/game/stats`, authHeaders())
        if (statsRes.data.success) {
          setStatsData(statsRes.data)
        }

        const challengesRes = await axios.get(`${API}/challenges`, authHeaders())
        if (challengesRes.data.success) {
          setChallenges(challengesRes.data.challenges)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        addToast('Failed to load dashboard data. Using local defaults.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [authHeaders, addToast])

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="waiting-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    )
  }

  const {
    summaryStats = user?.stats || {},
    unlockedAchievements = [],
    allAchievements = [],
    cognitiveTrend = [],
    streak = 0
  } = statsData || {}

  // Calculate cognitive aggregates
  const avgAccuracy = cognitiveTrend.length > 0
    ? Math.round(cognitiveTrend.reduce((sum, item) => sum + (item.spatialAccuracy || 75), 0) / cognitiveTrend.length)
    : 75
  const avgAttention = cognitiveTrend.length > 0
    ? Math.round(cognitiveTrend.reduce((sum, item) => sum + (item.attentionScore || 80), 0) / cognitiveTrend.length)
    : 80

  const formatTime = (seconds) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handlePlayChallenge = (challenge) => {
    addToast(`Entering Daily Challenge: ${challenge.title}! 🎯`, 'info')
    navigate(`/game?challengeId=${challenge._id}&difficulty=${challenge.difficulty}&targetTime=${challenge.targetTime}&targetMoves=${challenge.targetMoves}&title=${encodeURIComponent(challenge.title)}`)
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Brain Dashboard</h1>
          <p className="page-subtitle">Track your cognitive growth, badges, and active neural challenges.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/game" className="btn btn-primary">🧠 Play Solo</Link>
          <Link to="/multiplayer" className="btn btn-secondary">⚡ Multiplayer Hub</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Profile Card */}
        <div className="glass-dark" style={{ padding: 'var(--space-6)', display: 'flex', gap: 16, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="player-avatar" style={{ width: 64, height: 64, fontSize: '2rem' }}>
            🧠
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{user?.username}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span className="badge-tag" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 'var(--fs-xs)', color: 'var(--brand-accent)' }}>
                {user?.role === 'admin' ? '🛡️ Admin' : '⭐ Neural Cadet'}
              </span>
              {user?.isGuest && (
                <span className="badge-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 'var(--fs-xs)', color: 'var(--brand-danger)' }}>
                  Guest Mode
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Daily Streak</span>
                <div style={{ fontSize: 'var(--fs-md)', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🔥 {streak?.count || 0} days
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Neural Points</span>
                <div style={{ fontSize: 'var(--fs-md)', fontWeight: 800, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                  💎 {summaryStats.points || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic AI Performance Overview */}
        <div className="glass" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🧠</span> Cognitive Index (Last {cognitiveTrend.length || 0} Games)
          </h3>
          <div className="perf-bar-wrap">
            <div className="perf-bar-row">
              <span className="perf-bar-label">Spatial Accuracy</span>
              <div className="perf-bar-track">
                <div className="perf-bar-fill good" style={{ width: `${avgAccuracy}%` }} />
              </div>
              <span className="perf-bar-value">{avgAccuracy}%</span>
            </div>
            <div className="perf-bar-row">
              <span className="perf-bar-label">Attention Focus</span>
              <div className="perf-bar-track">
                <div className="perf-bar-fill" style={{ width: `${avgAttention}%` }} />
              </div>
              <span className="perf-bar-value">{avgAttention}%</span>
            </div>
          </div>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.4 }}>
            Based on dynamic card matching heuristics including visual backtracks, recall delay, and pair efficiency.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginBottom: 16 }}>Performance Metrics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-card-icon">👑</div>
          <div className="stat-card-value">{summaryStats.bestScore || 0}</div>
          <div className="stat-card-label">Best Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🎮</div>
          <div className="stat-card-value">{summaryStats.gamesPlayed || 0}</div>
          <div className="stat-card-label">Games Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-value">{summaryStats.avgCompletionTime || 0}s</div>
          <div className="stat-card-label">Avg Complete Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🖱</div>
          <div className="stat-card-value">{summaryStats.totalMoves || 0}</div>
          <div className="stat-card-label">Total Moves</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⏱️</div>
          <div className="stat-card-value">{formatTime(summaryStats.totalTime)}</div>
          <div className="stat-card-label">Time Spent</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', lgGridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Left Side: Daily Challenges & Performance History */}
        <div>
          {/* Daily Challenges */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', justifyComposite: 'space-between', justifyContent: 'space-between' }}>
              <span>🎯 Daily Challenges</span>
              <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>Active Today</span>
            </h3>
            {challenges.length === 0 ? (
              <div className="glass" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active challenges available today. Check back later!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {challenges.map(ch => (
                  <div key={ch._id} className="glass" style={{ padding: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <h4 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ch.title}
                        <span style={{ fontSize: 'var(--fs-xs)', background: ch.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.15)' : (ch.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'), color: ch.difficulty === 'hard' ? 'var(--brand-danger)' : (ch.difficulty === 'medium' ? 'var(--brand-accent)' : 'var(--brand-success)'), borderRadius: 'var(--radius-sm)', padding: '1px 6px' }}>
                          {ch.difficulty}
                        </span>
                      </h4>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{ch.description}</p>
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                        <span>⏱️ Target Time: <strong>&lt;= {ch.targetTime}s</strong></span>
                        <span>🖱️ Target Moves: <strong>&lt;= {ch.targetMoves}</strong></span>
                        <span>💎 Reward: <strong style={{ color: '#06b6d4' }}>+{ch.pointsReward} Points</strong></span>
                      </div>
                    </div>
                    <button className="btn btn-gold" onClick={() => handlePlayChallenge(ch)}>
                      ⚡ Run Challenge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Cognitive Trend Log */}
          <div>
            <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginBottom: 16 }}>Recent Session Activity</h3>
            {cognitiveTrend.length === 0 ? (
              <div className="glass" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No completed game sessions found yet. Play a game to see stats!
              </div>
            ) : (
              <div className="glass" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase' }}>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Date</th>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Diff</th>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Score</th>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Time</th>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Moves</th>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Spatial Acc</th>
                      <th style={{ padding: 'var(--space-4) var(--space-6)' }}>Attention Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cognitiveTrend.map((session, index) => (
                      <tr key={index} style={{ borderBottom: index < cognitiveTrend.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: 'var(--fs-sm)' }}>
                        <td style={{ padding: 'var(--space-4) var(--space-6)', color: 'var(--text-muted)' }}>
                          {new Date(session.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{session.difficulty}</span>
                        </td>
                        <td style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {session.score}
                        </td>
                        <td style={{ padding: 'var(--space-4) var(--space-6)', fontFamily: 'var(--font-mono)' }}>{session.time}s</td>
                        <td style={{ padding: 'var(--space-4) var(--space-6)', fontFamily: 'var(--font-mono)' }}>{session.moves}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                          <strong style={{ color: session.spatialAccuracy >= 75 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>
                            {session.spatialAccuracy}%
                          </strong>
                        </td>
                        <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                          <strong style={{ color: session.attentionScore >= 80 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>
                            {session.attentionScore}%
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Neural Badges / Achievements */}
        <div>
          <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginBottom: 16 }}>Neural Achievements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allAchievements.map(ach => {
              const isUnlocked = unlockedAchievements.some(un => un.id === ach.id)
              const unlockInfo = unlockedAchievements.find(un => un.id === ach.id)

              return (
                <div key={ach.id} className={`achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <span className="badge-icon">{ach.badgeUrl}</span>
                  <div className="badge-info" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge-name">{ach.name}</span>
                      {isUnlocked && <span style={{ fontSize: 10, color: 'var(--brand-accent)', fontWeight: 600 }}>UNLOCKED</span>}
                    </div>
                    <div className="badge-desc">{ach.description}</div>
                    {isUnlocked && unlockInfo?.unlockedAt && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                        Unlocked {new Date(unlockInfo.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
