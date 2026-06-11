const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const GameHUD = ({ moves, time, matchesFound, pairs, score, difficulty, onPause, gameStatus }) => (
  <div className="game-hud">
    <div className="hud-stat">
      <span className="hud-stat-label">⏱ Time</span>
      <span className="hud-stat-value">{formatTime(time)}</span>
    </div>
    <div className="hud-stat">
      <span className="hud-stat-label">🖱 Moves</span>
      <span className="hud-stat-value">{moves}</span>
    </div>
    <div className="hud-stat">
      <span className="hud-stat-label">🃏 Pairs</span>
      <span className="hud-stat-value">{matchesFound}/{pairs}</span>
    </div>
    <div className="hud-stat">
      <span className="hud-stat-label">⭐ Score</span>
      <span className="hud-stat-value">{score}</span>
    </div>
    <button
      className="btn btn-secondary btn-sm"
      onClick={onPause}
      style={{ minWidth: 90 }}
    >
      {gameStatus === 'paused' ? '▶ Resume' : '⏸ Pause'}
    </button>
    <span className="badge" style={{ textTransform: 'capitalize' }}>
      {difficulty}
    </span>
  </div>
)

export default GameHUD
