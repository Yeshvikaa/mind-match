import { useState, useEffect, useRef, useCallback } from 'react'

const CARD_EMOJIS = ['🧠','⚡','👁️','👑','🔮','🌀','🧪','💎','🔑','❤️','🌟','🍀','🍎','🧩','🎨','🚀','🌈','🛸']

const DIFFICULTY_CONFIG = {
  easy:   { pairs: 4,  cols: 4, scoreBase: 800  },
  medium: { pairs: 8,  cols: 6, scoreBase: 1200 },
  hard:   { pairs: 12, cols: 8, scoreBase: 2000 }
}

function generateBoard(difficulty) {
  const { pairs } = DIFFICULTY_CONFIG[difficulty]
  const selected = CARD_EMOJIS.slice(0, pairs)
  const deck = [...selected, ...selected]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.map((value, index) => ({ id: index, value, isFlipped: false, isMatched: false }))
}

export const useGame = (difficulty = 'medium') => {
  const [cards, setCards] = useState([])
  const [moves, setMoves] = useState(0)
  const [matchesFound, setMatchesFound] = useState(0)
  const [time, setTime] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStatus, setGameStatus] = useState('idle') // idle | playing | paused | complete
  const [flipLog, setFlipLog] = useState([])

  const flippedRef = useRef([])    // indices of currently flipped (unmatched) cards
  const lockRef = useRef(false)    // prevent clicks during pair evaluation
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const { pairs, scoreBase } = DIFFICULTY_CONFIG[difficulty]

  const startGame = useCallback(() => {
    setCards(generateBoard(difficulty))
    setMoves(0)
    setMatchesFound(0)
    setTime(0)
    setScore(0)
    setFlipLog([])
    flippedRef.current = []
    lockRef.current = false
    setGameStatus('playing')
    startTimeRef.current = Date.now()

    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }, [difficulty])

  const pauseGame = useCallback(() => {
    setGameStatus(s => {
      if (s === 'playing') { clearInterval(timerRef.current); return 'paused' }
      if (s === 'paused') {
        startTimeRef.current = Date.now() - time * 1000
        timerRef.current = setInterval(() => setTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
        return 'playing'
      }
      return s
    })
  }, [time])

  const flipCard = useCallback((index) => {
    if (lockRef.current || gameStatus !== 'playing') return
    const card = cards[index]
    if (!card || card.isFlipped || card.isMatched) return

    // Log the flip for AI analysis
    const logEntry = { cardIndex: index, cardValue: card.value, timestamp: Date.now() }

    setFlipLog(prev => [...prev, logEntry])

    setCards(prev => {
      const next = [...prev]
      next[index] = { ...next[index], isFlipped: true }
      return next
    })

    flippedRef.current = [...flippedRef.current, index]

    if (flippedRef.current.length === 2) {
      lockRef.current = true
      const [i1, i2] = flippedRef.current
      flippedRef.current = []

      setMoves(m => m + 1)

      setTimeout(() => {
        setCards(prev => {
          const next = [...prev]
          if (next[i1].value === next[i2].value) {
            // Match!
            next[i1] = { ...next[i1], isMatched: true }
            next[i2] = { ...next[i2], isMatched: true }

            setMatchesFound(m => {
              const newMatches = m + 1
              if (newMatches === pairs) {
                // Win!
                clearInterval(timerRef.current)
                const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
                const finalMoves = moves + 1
                const timeBonusRaw = Math.max(0, scoreBase - finalTime * 8)
                const movePenalty = Math.max(0, (finalMoves - pairs) * 15)
                const finalScore = Math.max(100, timeBonusRaw - movePenalty + (pairs * 50))
                setScore(finalScore)
                setGameStatus('complete')
              }
              return newMatches
            })
          } else {
            // No match — flip back
            next[i1] = { ...next[i1], isFlipped: false }
            next[i2] = { ...next[i2], isFlipped: false }
          }
          return next
        })
        lockRef.current = false
      }, 900)
    }
  }, [cards, gameStatus, pairs, scoreBase, moves])

  const resetGame = useCallback(() => {
    clearInterval(timerRef.current)
    setGameStatus('idle')
    setCards([])
    setMoves(0)
    setMatchesFound(0)
    setTime(0)
    setScore(0)
    setFlipLog([])
    flippedRef.current = []
    lockRef.current = false
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  return {
    cards, moves, matchesFound, time, score, gameStatus,
    flipLog, pairs,
    startGame, pauseGame, flipCard, resetGame,
    config: DIFFICULTY_CONFIG[difficulty]
  }
}
