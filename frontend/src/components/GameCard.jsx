const GameCard = ({ card, onClick, cardTheme = 'neon-brain', size = 'medium' }) => {
  const { isFlipped, isMatched, value } = card

  const themeClass = {
    'neon-brain': '',
    'space-nebula': 'theme-space-nebula',
    'magic-runes': 'theme-magic-runes',
    'retro-pixel': 'theme-retro-pixel',
  }[cardTheme] || ''

  const sizeStyle = {
    easy: { fontSize: '2.2rem' },
    medium: { fontSize: '1.7rem' },
    hard: { fontSize: '1.2rem' }
  }[size] || {}

  return (
    <div
      className={`card-wrapper ${themeClass} ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={() => !isFlipped && !isMatched && onClick(card.id)}
      role="button"
      aria-label={isFlipped || isMatched ? `Card: ${value}` : 'Face-down card'}
    >
      <div className="card-inner">
        <div className="card-face card-back">
          <div className="card-pattern" />
          <span className="card-logo">🧠</span>
        </div>
        <div className="card-face card-front" style={sizeStyle}>
          {value}
        </div>
      </div>
    </div>
  )
}

export default GameCard
