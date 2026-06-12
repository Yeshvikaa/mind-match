import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = 'https://mind-match-s0na.onrender.com/api'
const DIFFICULTIES = ['easy', 'medium', 'hard']

const LeaderboardPage = () => {
  const { authHeaders, addToast } = useAuth()
  const [difficulty, setDifficulty] = useState('medium')
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const { data } = await axios.get(`${API}/game/leaderboard?difficulty=${difficulty}`, authHeaders())
        if (data.success) {
          setLeaders(data.leaderboard || [])
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        addToast('Failed to load leaderboard.', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [difficulty, authHeaders, addToast])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="page-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 className="page-title">Global Leaderboard</h1>
        <p className="page-subtitle">Compete with the sharpest minds across difficulty challenges.</p>
      </div>

      {/* Difficulty Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {DIFFICULTIES.map(diff => (
          <button
            key={diff}
            className={`tab-btn ${difficulty === diff ? 'active' : ''}`}
            onClick={() => setDifficulty(diff)}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard Table / Grid */}
      <div className="glass-dark" style={{ padding: 'var(--space-4)', minHeight: 400 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 380 }}>
            <div className="waiting-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 380, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👑</div>
            <p>No highscores recorded on {difficulty} yet.</p>
            <p style={{ fontSize: 'var(--fs-xs)' }}>Be the first to claim the top spot!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Header row */}
            <div className="leaderboard-row" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 8, pointerEvents: 'none' }}>
              <span>Rank</span>
              <span>Player</span>
              <span>Score</span>
              <span>Time</span>
              <span>Moves</span>
            </div>

            {/* Leader rows */}
            {leaders.map((entry, index) => {
              const rank = index + 1
              let rankClass = ''
              if (rank === 1) rankClass = 'rank-1'
              if (rank === 2) rankClass = 'rank-2'
              if (rank === 3) rankClass = 'rank-3'

              return (
                <div key={entry._id} className={`leaderboard-row ${rankClass}`}>
                  <div className="rank-badge">
                    {rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : rank))}
                  </div>
                  <div className="player-info">
                    <div className="player-avatar">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{entry.username}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                    💎 {entry.score.toLocaleString()}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    ⏱️ {formatTime(entry.timeSpent)}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    🖱️ {entry.moves}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardPage
