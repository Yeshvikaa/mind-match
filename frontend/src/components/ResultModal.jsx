import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:5000/api'

const PerfBar = ({ label, value, type }) => {
  const [width, setWidth] = useState(0)
  useEffect(() => { setTimeout(() => setWidth(value), 200) }, [value])

  return (
    <div className="perf-bar-row">
      <span className="perf-bar-label">{label}</span>
      <div className="perf-bar-track">
        <div
          className={`perf-bar-fill ${type}`}
          style={{ width: `${width}%`, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </div>
      <span className="perf-bar-value">{value}%</span>
    </div>
  )
}

const ResultModal = ({ score, moves, time, difficulty, flipLog, newAchievements = [], challengeId = null, onPlayAgain, onExit, onClose }) => {
  const { authHeaders, addToast } = useAuth()
  const [aiStats, setAiStats] = useState(null)
  const [saving, setSaving] = useState(true)

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  useEffect(() => {
    const saveSession = async () => {
      try {
        const { data } = await axios.post(`${API}/game/session`, {
          difficulty, moves, timeSpent: time, score, flipLog
        }, authHeaders())

        if (data.success) {
          // Show achievement toasts
          data.newAchievements?.forEach(a => {
            if (a) addToast(`🏆 Achievement Unlocked: ${a.name}!`, 'achievement', 5000)
          })
        }
      } catch (err) {
        console.warn('Could not save session:', err.message)
      }

      // Submit challenge completion if active
      if (challengeId) {
        try {
          const { data } = await axios.post(`${API}/challenges/${challengeId}/complete`, {
            timeSpent: time, moves
          }, authHeaders())
          if (data.success) {
            addToast(data.message, 'success', 6000)
          } else {
            addToast(data.message, 'warning', 6000)
          }
        } catch (err) {
          console.warn('Could not submit challenge completion:', err.message)
        }
      }

      setSaving(false)
    }

    // Simple AI stats calculated locally for display (real computation on backend)
    setAiStats({
      spatialAccuracy: Math.min(100, Math.max(30, 100 - (moves - (flipLog.length / 4)) * 5)),
      attentionFocusScore: Math.min(100, Math.max(30, 120 - time * 0.8)),
      forgettingRate: parseFloat((moves / Math.max(1, flipLog.length / 2)).toFixed(2))
    })

    saveSession()
  }, [])

  const getGrade = () => {
    if (score >= 1800) return { label: 'S', color: '#f59e0b' }
    if (score >= 1200) return { label: 'A', color: '#10b981' }
    if (score >= 700)  return { label: 'B', color: '#06b6d4' }
    if (score >= 300)  return { label: 'C', color: '#8b5cf6' }
    return                 { label: 'D', color: '#94a3b8' }
  }

  const grade = getGrade()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '4rem' }}>🎉</div>
          <h2 style={{ margin: '8px 0 4px', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Puzzle Complete!
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
          </div>
        </div>

        {/* Score + Grade */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-card-icon">⭐</div>
            <div className="stat-card-value">{score.toLocaleString()}</div>
            <div className="stat-card-label">Score</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-card-icon">⏱</div>
            <div className="stat-card-value">{formatTime(time)}</div>
            <div className="stat-card-label">Time</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-card-icon">🖱</div>
            <div className="stat-card-value">{moves}</div>
            <div className="stat-card-label">Moves</div>
          </div>
          <div className="stat-card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: grade.color }}>{grade.label}</div>
            <div className="stat-card-label">Grade</div>
          </div>
        </div>

        {/* AI Insights */}
        {aiStats && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="section-title">🧠 AI Performance Analysis</div>
            <div className="perf-bar-wrap">
              <PerfBar label="Spatial Accuracy" value={aiStats.spatialAccuracy} type={aiStats.spatialAccuracy > 75 ? 'good' : 'warning'} />
              <PerfBar label="Attention Focus" value={aiStats.attentionFocusScore} type={aiStats.attentionFocusScore > 75 ? 'good' : 'warning'} />
            </div>
          </div>
        )}

        {/* New achievements */}
        {newAchievements.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="section-title">🏆 New Achievements</div>
            {newAchievements.filter(Boolean).map((a, i) => (
              <div key={i} className="achievement-badge unlocked" style={{ marginBottom: 6 }}>
                <span className="badge-icon">{a.badgeUrl}</span>
                <div className="badge-info">
                  <div className="badge-name">{a.name}</div>
                  <div className="badge-desc">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onPlayAgain}>
            🔄 Play Again
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onExit}>
            🏠 Main Menu
          </button>
        </div>
        {saving && <p style={{ textAlign: 'center', marginTop: 8, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Saving to leaderboard…</p>}
      </div>
    </div>
  )
}

export default ResultModal
