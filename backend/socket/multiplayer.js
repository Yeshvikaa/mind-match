// Live Multiplayer Match Rooms
// roomId -> { id, host, guest, board, turn, scoreHost, scoreGuest, matchesCount, activeFlips: [] }
const rooms = new Map();

// Helper to generate a room code
const generateRoomCode = () => {
  return 'MM-' + Math.floor(1000 + Math.random() * 9000);
};

// Generate card grid values based on difficulty
const generateMultiplayerBoard = (difficulty) => {
  const cardTypes = ['🧠', '⚡', '👁️', '👑', '🔮', '🌀', '🧪', '💎', '🔑', '❤️', '🌟', '🍀', '🍎', '🧩', '🎨', '🚀', '🌈', '🛸'];
  let count = 8; // Default medium (16 cards total / 8 pairs)
  if (difficulty === 'easy') count = 4; // 8 cards total / 4 pairs
  if (difficulty === 'hard') count = 12; // 24 cards total / 12 pairs

  const selectedPairs = cardTypes.slice(0, count);
  const deck = [...selectedPairs, ...selectedPairs];
  
  // Shuffle algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.map((value, index) => ({
    id: index,
    value,
    isFlipped: false,
    isMatched: false
  }));
};

export const initMultiplayerSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Create a Custom Invite Room
    socket.on('create_room', ({ username, difficulty = 'medium' }) => {
      const roomCode = generateRoomCode();
      const room = {
        code: roomCode,
        difficulty,
        host: {
          id: socket.id,
          username,
          score: 0,
          moves: 0
        },
        guest: null,
        board: null,
        turn: socket.id, // Host starts
        status: 'waiting',
        matchesFound: 0
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      
      console.log(`🏠 Room created: ${roomCode} by ${username}`);
      socket.emit('room_created', room);
    });

    // Join room with code
    socket.on('join_room', ({ username, roomCode }) => {
      const room = rooms.get(roomCode);

      if (!room) {
        return socket.emit('join_error', 'Lobby room not found!');
      }

      if (room.guest) {
        return socket.emit('join_error', 'Lobby is already full!');
      }

      if (room.status !== 'waiting') {
        return socket.emit('join_error', 'Game has already started in this room!');
      }

      room.guest = {
        id: socket.id,
        username,
        score: 0,
        moves: 0
      };

      room.status = 'ready';
      socket.join(roomCode);

      console.log(`👥 Room joined: ${roomCode} by guest ${username}`);
      
      // Notify both players
      io.to(roomCode).emit('room_ready', room);
    });

    // Randomized matchmaking
    socket.on('quick_match', ({ username }) => {
      // Look for a waiting room
      let matchedRoom = null;
      for (const [code, r] of rooms.entries()) {
        if (r.status === 'waiting' && !r.guest) {
          matchedRoom = r;
          break;
        }
      }

      if (matchedRoom) {
        matchedRoom.guest = {
          id: socket.id,
          username,
          score: 0,
          moves: 0
        };
        matchedRoom.status = 'ready';
        socket.join(matchedRoom.code);
        
        console.log(`⚡ Matchmaker paired ${username} in Room ${matchedRoom.code}`);
        io.to(matchedRoom.code).emit('room_ready', matchedRoom);
      } else {
        // Create a new room
        const roomCode = generateRoomCode();
        const room = {
          code: roomCode,
          difficulty: 'medium', // Default to medium for quick match
          host: {
            id: socket.id,
            username,
            score: 0,
            moves: 0
          },
          guest: null,
          board: null,
          turn: socket.id,
          status: 'waiting',
          matchesFound: 0
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        
        console.log(`⚡ Matchmaker created new room ${roomCode} for ${username}`);
        socket.emit('room_created', room);
      }
    });

    // Start Multiplayer Match
    socket.on('start_game', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room || room.host.id !== socket.id) return;

      room.board = generateMultiplayerBoard(room.difficulty);
      room.status = 'playing';

      io.to(roomCode).emit('game_started', {
        board: room.board.map(c => ({ id: c.id, isFlipped: false, isMatched: false })), // obfuscated values, server handles checks!
        turn: room.turn,
        room
      });
    });

    // Player flipping action
    socket.on('flip_card', ({ roomCode, cardIndex }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'playing') return;

      // Verify it is the user's turn
      if (room.turn !== socket.id) {
        return socket.emit('flip_error', 'It is not your turn!');
      }

      const activePlayer = room.host.id === socket.id ? room.host : room.guest;
      const opponentPlayer = room.host.id === socket.id ? room.guest : room.host;
      
      const flippedCard = room.board[cardIndex];
      
      if (!flippedCard || flippedCard.isMatched || flippedCard.isFlipped) return;

      // Track active turn flips
      if (!room.activeFlips) room.activeFlips = [];

      flippedCard.isFlipped = true;
      room.activeFlips.push(cardIndex);

      // Broadcast single card reveal
      io.to(roomCode).emit('card_revealed', {
        cardIndex,
        value: flippedCard.value,
        playerSocketId: socket.id
      });

      // Handle pair evaluation when two cards are flipped
      if (room.activeFlips.length === 2) {
        const idx1 = room.activeFlips[0];
        const idx2 = room.activeFlips[1];
        
        activePlayer.moves += 1;

        const card1 = room.board[idx1];
        const card2 = room.board[idx2];

        if (card1.value === card2.value) {
          // MATCH!
          card1.isMatched = true;
          card2.isMatched = true;
          activePlayer.score += 100;
          room.matchesFound += 1;
          
          room.activeFlips = [];

          io.to(roomCode).emit('match_success', {
            matchIndices: [idx1, idx2],
            scoreHost: room.host.score,
            scoreGuest: room.guest.score,
            playerSocketId: socket.id,
            movesHost: room.host.moves,
            movesGuest: room.guest.moves
          });

          // Check Win Condition
          const totalPairsNeeded = room.difficulty === 'easy' ? 4 : (room.difficulty === 'hard' ? 12 : 8);
          if (room.matchesFound === totalPairsNeeded) {
            room.status = 'completed';
            let winner = 'draw';
            if (room.host.score > room.guest.score) winner = 'host';
            if (room.guest.score > room.host.score) winner = 'guest';

            io.to(roomCode).emit('game_over', {
              winner,
              room
            });
            rooms.delete(roomCode);
          }
          // Note: Successful match keeps active player turn!
        } else {
          // NO MATCH!
          // Flip back server state
          card1.isFlipped = false;
          card2.isFlipped = false;
          room.activeFlips = [];

          // Switch turns
          room.turn = opponentPlayer.id;

          // Notify clients to flip back cards after delay
          io.to(roomCode).emit('match_failed', {
            flipBackIndices: [idx1, idx2],
            nextTurn: room.turn,
            movesHost: room.host.moves,
            movesGuest: room.guest.moves
          });
        }
      }
    });

    // Room messaging
    socket.on('send_chat', ({ roomCode, message, username }) => {
      io.to(roomCode).emit('receive_chat', {
        sender: username,
        message,
        timestamp: new Date()
      });
    });

    // Leaving / Disconnecting
    socket.on('leave_room', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        socket.leave(roomCode);
        io.to(roomCode).emit('opponent_left', {
          socketId: socket.id,
          message: 'Your opponent left the game lobby!'
        });
        rooms.delete(roomCode);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      // Find room user was in and clean it up
      for (const [code, room] of rooms.entries()) {
        if (room.host.id === socket.id || (room.guest && room.guest.id === socket.id)) {
          io.to(code).emit('opponent_left', {
            socketId: socket.id,
            message: 'Your opponent disconnected from the match.'
          });
          rooms.delete(code);
          break;
        }
      }
    });
  });
};
