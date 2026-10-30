import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Serve client in production build if available
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager(io);

// Track socket to room mapping
const socketToRoom = new Map();
const socketToPlayer = new Map();

io.on('connection', (socket) => {
  // Join public matchmaking
  socket.on('join_public', (data) => {
    const { playerId, name, avatar } = data;
    const room = gameManager.findAvailablePublicRoom();

    socket.join(room.id);
    socketToRoom.set(socket.id, room.id);
    socketToPlayer.set(socket.id, playerId);

    const player = room.addPlayer({
      id: playerId,
      socketId: socket.id,
      name,
      avatar
    });

    socket.emit('joined_room', {
      roomId: room.id,
      playerId: player.id,
      isHost: player.isHost
    });

    room.broadcastState();

    // Send drawing history if game in progress
    if (room.state === 'DRAWING' && room.drawingHistory.length > 0) {
      socket.emit('drawing_history', room.drawingHistory);
    }

    io.to(room.id).emit('chat_message', {
      type: 'system',
      subType: 'join',
      text: `${player.name} joined the room!`
    });
  });

  // Create private room
  socket.on('create_room', (data) => {
    const { playerId, name, avatar } = data;
    const room = gameManager.createRoom(true);

    socket.join(room.id);
    socketToRoom.set(socket.id, room.id);
    socketToPlayer.set(socket.id, playerId);

    const player = room.addPlayer({
      id: playerId,
      socketId: socket.id,
      name,
      avatar
    });

    socket.emit('joined_room', {
      roomId: room.id,
      playerId: player.id,
      isHost: true
    });

    room.broadcastState();

    io.to(room.id).emit('chat_message', {
      type: 'system',
      subType: 'join',
      text: `${player.name} created the room!`
    });
  });

  // Join room by room code
  socket.on('join_room', (data) => {
    const { roomId, playerId, name, avatar } = data;
    const room = gameManager.getRoom(roomId);

    if (!room) {
      socket.emit('error_message', { message: 'Room not found! Check your room code.' });
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('error_message', { message: 'Room is full!' });
      return;
    }

    socket.join(room.id);
    socketToRoom.set(socket.id, room.id);
    socketToPlayer.set(socket.id, playerId);

    const player = room.addPlayer({
      id: playerId,
      socketId: socket.id,
      name,
      avatar
    });

    socket.emit('joined_room', {
      roomId: room.id,
      playerId: player.id,
      isHost: player.isHost
    });

    room.broadcastState();

    if (room.state === 'DRAWING' && room.drawingHistory.length > 0) {
      socket.emit('drawing_history', room.drawingHistory);
    }

    io.to(room.id).emit('chat_message', {
      type: 'system',
      subType: 'join',
      text: `${player.name} joined the room!`
    });
  });

  // Update room settings (host only)
  socket.on('update_settings', (data) => {
    const { roomId, settings } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'LOBBY') return;

    const playerId = socketToPlayer.get(socket.id);
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) return;

    room.settings = { ...room.settings, ...settings };
    room.broadcastState();
  });

  // Start game (host only)
  socket.on('start_game', (data) => {
    const { roomId } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'LOBBY') return;

    const playerId = socketToPlayer.get(socket.id);
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) return;

    if (room.players.length < 2) {
      socket.emit('error_message', { message: 'Need at least 2 players to start!' });
      return;
    }

    room.startGame();
  });

  // Word selection (drawer only)
  socket.on('select_word', (data) => {
    const { roomId, word } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'CHOOSING_WORD') return;

    const playerId = socketToPlayer.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    room.selectWord(word);
  });

  // Drawing stroke synchronization
  socket.on('draw_stroke', (data) => {
    const { roomId, stroke } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'DRAWING') return;

    const playerId = socketToPlayer.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    room.drawingHistory.push({ type: 'stroke', data: stroke });
    // Broadcast stroke to other players in room
    socket.to(room.id).emit('draw_stroke', stroke);
  });

  // Bucket flood fill
  socket.on('fill_bucket', (data) => {
    const { roomId, fill } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'DRAWING') return;

    const playerId = socketToPlayer.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    room.drawingHistory.push({ type: 'fill', data: fill });
    socket.to(room.id).emit('fill_bucket', fill);
  });

  // Clear canvas
  socket.on('clear_canvas', (data) => {
    const { roomId } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'DRAWING') return;

    const playerId = socketToPlayer.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    room.drawingHistory = [{ type: 'clear' }];
    io.to(room.id).emit('clear_canvas');
  });

  // Undo stroke
  socket.on('undo_stroke', (data) => {
    const { roomId } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'DRAWING') return;

    const playerId = socketToPlayer.get(socket.id);
    if (playerId !== room.currentDrawerId) return;

    // Pop the last stroke/fill
    while (room.drawingHistory.length > 0) {
      const last = room.drawingHistory.pop();
      if (last.type === 'stroke' && last.data && last.data.isEnd) {
        break;
      }
    }

    io.to(room.id).emit('redraw_canvas', room.drawingHistory);
  });

  // Chat message / Guess
  socket.on('send_chat', (data) => {
    const { roomId, playerId, text } = data;
    const room = gameManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    const result = room.handleGuess(playerId, text);

    if (!result) {
      // General lobby or intermission chat
      io.to(room.id).emit('chat_message', {
        type: 'user',
        senderName: player.name,
        playerId: player.id,
        text: text
      });
      return;
    }

    if (result.type === 'already_guessed') {
      // Skribbl secret guess chat: only show to other players who already guessed
      for (const p of room.players) {
        if (p.guessed || p.id === room.currentDrawerId) {
          io.to(p.socketId).emit('chat_message', {
            type: 'user',
            senderName: player.name,
            playerId: player.id,
            text: text,
            isGuessedChat: true
          });
        }
      }
      return;
    }

    if (result.type === 'normal') {
      io.to(room.id).emit('chat_message', {
        type: 'user',
        senderName: player.name,
        playerId: player.id,
        text: text
      });
    }
  });

  // Play again / Reset to lobby
  socket.on('play_again', (data) => {
    const { roomId } = data;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'GAME_OVER') return;

    const playerId = socketToPlayer.get(socket.id);
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) return;

    room.resetToLobby();
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    const room = gameManager.getRoom(roomId);
    if (room) {
      const removed = room.removePlayer(socket.id);
      if (removed) {
        io.to(room.id).emit('chat_message', {
          type: 'system',
          subType: 'leave',
          text: `${removed.name} left the room.`
        });
        room.broadcastState();
      }
      gameManager.cleanupRoom(roomId);
    }

    socketToRoom.delete(socket.id);
    socketToPlayer.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Skribbl game server listening on http://localhost:${PORT}`);
});
