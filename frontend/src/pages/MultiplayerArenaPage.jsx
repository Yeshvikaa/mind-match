import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import GameCard from '../components/GameCard'
import ConfettiCanvas from '../components/ConfettiCanvas'

const MultiplayerArenaPage = () => {
  const { user, addToast } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [socket, setSocket] = useState(null)
  const [room, setRoom] = useState(null)
  const [board, setBoard] = useState([])
  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [myMoves, setMyMoves] = useState(0)
  const [oppMoves, setOppMoves] = useState(0)
  const [currentTurn, setCurrentTurn] = useState(null)
  const [mySocketId, setMySocketId] = useState(null)
  const [gameStatus, setGameStatus] = useState('lobby') // lobby | playing | gameover
  const [winner, setWinner] = useState(null)
  const [chat, setChat] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [confetti, setConfetti] = useState(false)
  const chatRef = useRef(null)

  // Initialize from session storage (set by MultiplayerPage)
  useEffect(() => {
    const savedRoom = sessionStorage.getItem('mp_room')
    const savedSocketId = sessionStorage.getItem('mp_socket_id')

    if (!savedRoom) {
      navigate('/multiplayer')
      return
    }

    const roomData = JSON.parse(savedRoom)
    setRoom(roomData)

    const s = io('http://localhost:5000', { transports: ['websocket'] })
    setSocket(s)

    s.on('connect', () => {
      setMySocketId(s.id)
      // Rejoin the room
      s.emit('join_room', { username: user.username, roomCode: roomData.code })
    })

    s.on('room_ready', (updatedRoom) => {
      setRoom(updatedRoom)
    })

    s.on('game_started', ({ board: serverBoard, turn, room: updatedRoom }) => {
      setBoard(serverBoard.map((c, idx) => ({
        id: idx, value: null, isFlipped: false, isMatched: false
      })))
      setCurrentTurn(turn)
      setRoom(updatedRoom)
      setGameStatus('playing')
    })

    s.on('card_revealed', ({ cardIndex, value, playerSocketId }) => {
      setBoard(prev => {
        const next = [...prev]
        next[cardIndex] = { ...next[cardIndex], isFlipped: true, value }
        return next
      })
    })

    s.on('match_success', ({ matchIndices, scoreHost, scoreGuest, movesHost, movesGuest }) => {
      setBoard(prev => {
        const next = [...prev]
        matchIndices.forEach(i => { next[i] = { ...next[i], isMatched: true } })
        return next
      })
      setRoom(prev => {
        if (!prev) return prev
        const isHost = prev.host?.id === mySocketId || prev.host?.id === savedSocketId
        setMyScore(isHost ? scoreHost : scoreGuest)
        setOppScore(isHost ? scoreGuest : scoreHost)
        setMyMoves(isHost ? movesHost : movesGuest)
        setOppMoves(isHost ? movesGuest : movesHost)
        return prev
      })
    })

    s.on('match_failed', ({ flipBackIndices, nextTurn, movesHost, movesGuest }) => {
      setTimeout(() => {
        setBoard(prev => {
          const next = [...prev]
          flipBackIndices.forEach(i => { next[i] = { ...next[i], isFlipped: false, value: null } })
          return next
        })
        setCurrentTurn(nextTurn)
      }, 800)
      setMyMoves(m => m + 1)
    })

    s.on('game_over', ({ winner: w, room: finalRoom }) => {
      setGameStatus('gameover')
      setWinner(w)
      const isHost = finalRoom.host?.id === s.id
      if ((w === 'host' && isHost) || (w === 'guest' && !isHost)) {
        setConfetti(true)
        addToast('🏆 You won the match!', 'success')
      } else if (w === 'draw') {
        addToast("🤝 It's a draw!", 'info')
      } else {
        addToast('Better luck next time!', 'info')
      }
    })

    s.on('opponent_left', ({ message }) => {
      addToast(message, 'error')
      setTimeout(() => navigate('/multiplayer'), 2000)
    })

    s.on('receive_chat', (msg) => {
      setChat(prev => [...prev, msg])
      setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 100)
    })

    return () => {
      sessionStorage.removeItem('mp_room')
      sessionStorage.removeItem('mp_socket_id')
      s.disconnect()
    }
  }, [])

  const handleStartGame = () => {
    if (!socket || !room) return
    socket.emit('start_game', { roomCode: room.code })
  }

  const handleFlipCard = (cardIndex) => {
    if (!socket || currentTurn !== mySocketId) return
    socket.emit('flip_card', { roomCode: room.code, cardIndex })
  }

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatMsg.trim() || !socket) return
    socket.emit('send_chat', { roomCode: room.code, message: chatMsg, username: user.username })
    setChatMsg('')
  }

  const isMyTurn = currentTurn === mySocketId
  const difficulty = room?.difficulty || 'medium'

  if (!room) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <ConfettiCanvas active={confetti} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title">⚔️ Live Arena</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="badge">Room: {room.code}</span>
          <span className="badge cyan">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
          {gameStatus === 'playing' && (
            <span className={`badge ${isMyTurn ? 'green' : ''}`}>
              {isMyTurn ? '✅ Your Turn' : '⏳ Opponent\'s Turn'}
            </span>
          )}
        </div>
      </div>

      {/* Lobby State */}
      {gameStatus === 'lobby' && (
        <div className="room-lobby">
          <div className="glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🏠</div>
            <div style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              {room.guest ? '✅ Both players connected! Host can start.' : 'Waiting for opponent…'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <div className="mp-player-panel active">
                <div style={{ fontWeight: 700 }}>👤 {room.host?.username}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Host</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 900 }}>VS</div>
              <div className="mp-player-panel">
                <div style={{ fontWeight: 700 }}>{room.guest ? `👤 ${room.guest.username}` : '⌛ Waiting…'}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Guest</div>
              </div>
            </div>
            {room.guest && (
              <button id="btn-start-mp" className="btn btn-primary btn-lg" onClick={handleStartGame}>
                🎮 Start Game
              </button>
            )}
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameStatus === 'gameover' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
              {winner === 'draw' ? '🤝' : confetti ? '🏆' : '😔'}
            </div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {winner === 'draw' ? "It's a Draw!" : confetti ? 'You Won!' : 'You Lost'}
            </h2>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <div className="stat-card" style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="stat-card-value">{myScore}</div>
                <div className="stat-card-label">Your Score</div>
              </div>
              <div className="stat-card" style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="stat-card-value">{oppScore}</div>
                <div className="stat-card-label">Opponent</div>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/multiplayer')}>
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      {/* Playing */}
      {gameStatus === 'playing' && (
        <>
          {/* Score Panels */}
          <div className="mp-arena" style={{ marginBottom: 'var(--space-6)' }}>
            <div className={`mp-player-panel ${isMyTurn ? 'active' : ''}`}>
              <div style={{ fontWeight: 700 }}>You · {user.username}</div>
              <div className="mp-score-display" style={{ fontSize: 'var(--fs-3xl)' }}>{myScore}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{myMoves} moves</div>
            </div>
            <div className="mp-divider">
              <div style={{ fontWeight: 900, fontSize: 'var(--fs-2xl)' }}>VS</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{difficulty}</div>
            </div>
            <div className={`mp-player-panel ${!isMyTurn ? 'active' : ''}`}>
              <div style={{ fontWeight: 700 }}>Opponent</div>
              <div className="mp-score-display" style={{ fontSize: 'var(--fs-3xl)' }}>{oppScore}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{oppMoves} moves</div>
            </div>
          </div>

          {/* Board */}
          <div className={`game-board ${difficulty}`} style={{ opacity: isMyTurn ? 1 : 0.7, transition: 'opacity 0.3s' }}>
            {board.map((card, idx) => (
              <GameCard
                key={idx}
                card={card}
                onClick={() => handleFlipCard(idx)}
                size={difficulty}
              />
            ))}
          </div>

          {/* Chat */}
          <div style={{ maxWidth: 500, margin: 'var(--space-8) auto 0' }}>
            <div className="section-title">💬 Match Chat</div>
            <div className="chat-box" ref={chatRef} style={{ marginBottom: 8 }}>
              {chat.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', textAlign: 'center' }}>No messages yet…</div>}
              {chat.map((m, i) => (
                <div key={i} className="chat-message">
                  <span className="chat-sender">{m.sender}: </span>
                  <span>{m.message}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Say something…"
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Send</button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default MultiplayerArenaPage
