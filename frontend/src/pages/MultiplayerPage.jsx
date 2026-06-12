import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { io } from 'socket.io-client'

const MultiplayerPage = () => {
  const { user, addToast } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('create') // create | join | quick
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [socket, setSocket] = useState(null)
  const [waiting, setWaiting] = useState(false)
  const [createdRoom, setCreatedRoom] = useState(null)

  useEffect(() => {
    const s = io('https://mind-match-s0na.onrender.com', { transports: ['websocket'] })
    setSocket(s)

    s.on('room_created', (room) => {
      setCreatedRoom(room)
      setWaiting(true)
      addToast(`Room ${room.code} created! Waiting for opponent…`, 'info')
    })

    s.on('room_ready', (room) => {
      addToast('Opponent joined! Starting…', 'success')
      navigate('/multiplayer/arena', { state: { room, socket: null, socketId: s.id } })
      // Pass socket id via sessionStorage
      sessionStorage.setItem('mp_socket_id', s.id)
      sessionStorage.setItem('mp_room', JSON.stringify(room))
    })

    s.on('join_error', (msg) => {
      addToast(msg, 'error')
      setWaiting(false)
    })

    return () => { s.disconnect() }
  }, [])

  const handleCreateRoom = () => {
    if (!socket) return
    socket.emit('create_room', { username: user.username, difficulty })
  }

  const handleJoinRoom = () => {
    if (!socket || !joinCode.trim()) return
    socket.emit('join_room', { username: user.username, roomCode: joinCode.trim().toUpperCase() })
  }

  const handleQuickMatch = () => {
    if (!socket) return
    setWaiting(true)
    addToast('Finding a match…', 'info')
    socket.emit('quick_match', { username: user.username })
  }

  const handleCopyCode = () => {
    if (createdRoom?.code) {
      navigator.clipboard?.writeText(createdRoom.code)
      addToast('Room code copied! 📋', 'success')
    }
  }

  return (
    <div className="page-content">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="page-header text-center">
          <h1 className="page-title">⚔️ Multiplayer</h1>
          <p className="page-subtitle">Challenge a friend or find a random opponent</p>
        </div>

        <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
          <button id="tab-create" className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>Create Room</button>
          <button id="tab-join" className={`tab-btn ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>Join Room</button>
          <button id="tab-quick" className={`tab-btn ${tab === 'quick' ? 'active' : ''}`} onClick={() => setTab('quick')}>Quick Match</button>
        </div>

        <div className="glass" style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)' }}>
          {/* Create Tab */}
          {tab === 'create' && !waiting && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <div className="section-title">Difficulty</div>
                <div className="difficulty-selector">
                  {['easy', 'medium', 'hard'].map(d => (
                    <button key={d} id={`mp-diff-${d}`} className={`difficulty-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>
                      {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button id="btn-create-room" className="btn btn-primary btn-lg" onClick={handleCreateRoom}>
                🏠 Create Room
              </button>
            </div>
          )}

          {/* Waiting for opponent */}
          {tab === 'create' && waiting && createdRoom && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 'var(--fs-sm)' }}>Your Room Code</div>
                <div className="room-code-display">{createdRoom.code}</div>
              </div>
              <button className="btn btn-secondary" onClick={handleCopyCode}>📋 Copy Code</button>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                Waiting for an opponent to join…
              </div>
              <div className="waiting-dots" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Join Tab */}
          {tab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="room-code-input">Room Code</label>
                <input
                  id="room-code-input"
                  className="form-input"
                  placeholder="Enter code e.g. MM-4829"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  style={{ fontSize: 'var(--fs-xl)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <button
                id="btn-join-room"
                className="btn btn-primary btn-lg"
                onClick={handleJoinRoom}
                disabled={!joinCode.trim()}
              >
                🚪 Join Room
              </button>
            </div>
          )}

          {/* Quick Match Tab */}
          {tab === 'quick' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', alignItems: 'center' }}>
              <div style={{ fontSize: '4rem' }}>⚡</div>
              <div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Quick Match</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                  We'll find you a random opponent instantly. If no one is available, we'll create a room and wait.
                </p>
              </div>
              {waiting ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Searching for opponents…</div>
                  <div className="waiting-dots" style={{ display: 'flex', gap: 8 }}>
                    <span /><span /><span />
                  </div>
                </div>
              ) : (
                <button id="btn-quick-match" className="btn btn-gold btn-lg" onClick={handleQuickMatch}>
                  ⚡ Find Match
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 'var(--space-6)' }}>
          {[
            { icon: '🎮', title: 'Turn-Based', desc: 'Players alternate turns. Successful matches let you keep your turn.' },
            { icon: '⚡', title: 'Real-Time', desc: 'All moves sync instantly via WebSocket — no lag, no cheating.' },
          ].map((f, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MultiplayerPage
