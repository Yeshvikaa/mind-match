import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import GameCard from '../components/GameCard'
import GameHUD from '../components/GameHUD'
import ResultModal from '../components/ResultModal'
import ConfettiCanvas from '../components/ConfettiCanvas'
import { useAuth } from '../context/AuthContext'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const CARD_THEMES = ['neon-brain', 'space-nebula', 'magic-runes', 'retro-pixel']

const GamePage = () => {
  const [searchParams] = useSearchParams()
  const challengeId = searchParams.get('challengeId')
  const challengeDiff = searchParams.get('difficulty')
  const challengeTime = searchParams.get('targetTime')
  const challengeMoves = searchParams.get('targetMoves')
  const challengeTitle = searchParams.get('title')

  const [difficulty, setDifficulty] = useState('medium')
  const [cardTheme, setCardTheme] = useState('neon-brain')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (challengeDiff && DIFFICULTIES.includes(challengeDiff)) {
      setDifficulty(challengeDiff)
    }
  }, [challengeDiff])

  const {
    cards, moves, matchesFound, time, score, gameStatus,
    flipLog, pairs, startGame, pauseGame, flipCard, resetGame, config
  } = useGame(difficulty)

  const handleCardClick = (id) => flipCard(id)

  return (
    <div className="page-content">
      <ConfettiCanvas active={gameStatus === 'complete'} />

      {/* Pause Overlay */}
      {gameStatus === 'paused' && (
        <div className="pause-overlay">
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⏸</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>Game Paused</h2>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={pauseGame}>▶ Resume</button>
              <button className="btn btn-secondary" onClick={resetGame}>🏠 Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {gameStatus === 'complete' && (
        <ResultModal
          score={score} moves={moves} time={time}
          difficulty={difficulty} flipLog={flipLog}
          challengeId={challengeId}
          onPlayAgain={() => { resetGame(); setTimeout(startGame, 100) }}
          onExit={() => { resetGame(); navigate('/') }}
          onClose={() => {}}
        />
      )}

      {/* Pre-Game Setup */}
      {gameStatus === 'idle' && (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div className="page-header">
            <h1 className="page-title">{challengeId ? 'Daily Challenge' : 'Solo Challenge'}</h1>
            <p className="page-subtitle">
              {challengeId ? `Attempting challenge: ${challengeTitle}` : 'Choose your difficulty and flip theme, then go!'}
            </p>
          </div>

          {/* Active Daily Challenge Banner */}
          {challengeId && (
            <div className="glass" style={{ padding: 'var(--space-4) var(--space-6)', marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--brand-accent)', background: 'rgba(245, 158, 11, 0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--brand-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🎯 Challenge Targets
              </div>
              <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, margin: '4px 0 6px' }}>{challengeTitle}</h2>
              <div style={{ display: 'flex', gap: 16, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                <span>⏱️ Time: <strong>&lt;= {challengeTime}s</strong></span>
                <span>🖱️ Moves: <strong>&lt;= {challengeMoves}</strong></span>
              </div>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
                * Difficulty is locked to <strong>{challengeDiff.toUpperCase()}</strong>.
              </p>
            </div>
          )}

          {/* Difficulty */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="section-title" style={{ textAlign: 'left' }}>Difficulty</div>
            <div className="difficulty-selector">
              {[
                { key: 'easy',   icon: '🟢', grid: '4×4 · 8 cards',  label: 'Easy' },
                { key: 'medium', icon: '🟡', grid: '6×6 · 16 cards', label: 'Medium' },
                { key: 'hard',   icon: '🔴', grid: '8×8 · 24 cards', label: 'Hard' },
              ].map(d => (
                <button
                  key={d.key}
                  id={`diff-${d.key}`}
                  className={`difficulty-btn ${difficulty === d.key ? 'active' : ''}`}
                  onClick={() => !challengeId && setDifficulty(d.key)}
                  style={challengeId ? { opacity: difficulty === d.key ? 1 : 0.3, cursor: 'not-allowed' } : {}}
                  disabled={challengeId && difficulty !== d.key}
                >
                  <span className="diff-icon">{d.icon}</span>
                  <span>{d.label}</span>
                  <span className="diff-grid">{d.grid}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Theme */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div className="section-title" style={{ textAlign: 'left' }}>Card Theme</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'neon-brain', label: '⚡ Neon Brain' },
                { key: 'space-nebula', label: '🌌 Space Nebula' },
                { key: 'magic-runes', label: '🌿 Magic Runes' },
                { key: 'retro-pixel', label: '🎮 Retro Pixel' },
              ].map(t => (
                <button
                  key={t.key}
                  id={`theme-${t.key}`}
                  className={`difficulty-btn ${cardTheme === t.key ? 'active' : ''}`}
                  style={{ flex: '1 1 auto' }}
                  onClick={() => setCardTheme(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button id="btn-start-game" className="btn btn-primary btn-lg" onClick={startGame} style={{ width: '100%' }}>
            🧠 Start Game
          </button>
        </div>
      )}

      {/* Active Game Board */}
      {(gameStatus === 'playing' || gameStatus === 'paused') && (
        <>
          <GameHUD
            moves={moves} time={time} matchesFound={matchesFound}
            pairs={pairs} score={score} difficulty={difficulty}
            gameStatus={gameStatus} onPause={pauseGame}
          />
          <div className={`game-board ${difficulty}`}>
            {cards.map(card => (
              <GameCard
                key={card.id}
                card={card}
                cardTheme={cardTheme}
                size={difficulty}
                onClick={handleCardClick}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { resetGame() }}>
              ↩ Restart
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default GamePage
