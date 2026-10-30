import { getRandomWords, levenshteinDistance } from './words.js';

export class Room {
  constructor(id, isPrivate = false, io) {
    this.id = id;
    this.isPrivate = isPrivate;
    this.io = io;
    this.players = [];
    this.settings = {
      maxPlayers: 8,
      drawTime: 60,
      rounds: 3,
      wordCount: 3,
      hints: 2,
      customWords: []
    };
    this.state = 'LOBBY'; // LOBBY, CHOOSING_WORD, DRAWING, TURN_END, GAME_OVER
    this.currentRound = 1;
    this.currentTurnIndex = -1;
    this.currentDrawerId = null;
    this.currentWord = '';
    this.wordOptions = [];
    this.revealedIndices = new Set();
    this.drawingHistory = [];
    this.timeRemaining = 0;
    this.timerInterval = null;
    this.turnReason = ''; // 'guessed_all', 'time_up', 'drawer_left'
  }

  addPlayer(player) {
    // If player already in room, update socket
    const existing = this.players.find(p => p.id === player.id);
    if (existing) {
      existing.socketId = player.socketId;
      existing.name = player.name;
      existing.avatar = player.avatar;
      return existing;
    }

    const isHost = this.players.length === 0;
    const newPlayer = {
      id: player.id,
      socketId: player.socketId,
      name: player.name || `Player ${this.players.length + 1}`,
      avatar: player.avatar || { color: '#00cc00', eyes: 0, mouth: 0 },
      score: 0,
      turnScore: 0,
      guessed: false,
      isHost: isHost
    };

    this.players.push(newPlayer);
    this.updateRanks();
    return newPlayer;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index === -1) return null;

    const removed = this.players[index];
    const wasHost = removed.isHost;
    const wasDrawer = removed.id === this.currentDrawerId;

    this.players.splice(index, 1);

    // If host left, reassign host to first remaining player
    if (wasHost && this.players.length > 0) {
      this.players[0].isHost = true;
    }

    this.updateRanks();

    // If active drawer left during drawing or choosing
    if (wasDrawer && (this.state === 'DRAWING' || this.state === 'CHOOSING_WORD')) {
      this.clearTimer();
      this.turnReason = 'drawer_left';
      this.endTurn();
    } else if (this.state === 'DRAWING') {
      this.checkAllGuessed();
    }

    return removed;
  }

  updateRanks() {
    // Sort players descending by score
    const sorted = [...this.players].sort((a, b) => b.score - a.score);
    sorted.forEach((p, idx) => {
      p.rank = idx + 1;
    });
  }

  getPublicRoomState(targetPlayerId = null) {
    // Returns sanitized game state for clients
    // Ensures currentWord is never leaked unless in TURN_END or GAME_OVER or to the current drawer
    const isDrawer = targetPlayerId && targetPlayerId === this.currentDrawerId;
    const canSeeWord = isDrawer || this.state === 'TURN_END' || this.state === 'GAME_OVER';

    let displayWord = '';
    if (this.currentWord) {
      if (canSeeWord) {
        displayWord = this.currentWord;
      } else {
        displayWord = this.getMaskedWord();
      }
    }

    return {
      id: this.id,
      isPrivate: this.isPrivate,
      settings: this.settings,
      state: this.state,
      currentRound: this.currentRound,
      currentDrawerId: this.currentDrawerId,
      wordOptions: isDrawer && this.state === 'CHOOSING_WORD' ? this.wordOptions : [],
      displayWord: displayWord,
      wordLength: this.currentWord ? this.currentWord.length : 0,
      timeRemaining: this.timeRemaining,
      turnReason: this.turnReason,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        turnScore: p.turnScore,
        guessed: p.guessed,
        rank: p.rank,
        isHost: p.isHost,
        isDrawing: p.id === this.currentDrawerId
      }))
    };
  }

  broadcastState() {
    for (const player of this.players) {
      this.io.to(player.socketId).emit('room_state', this.getPublicRoomState(player.id));
    }
  }

  getMaskedWord() {
    if (!this.currentWord) return '';
    return this.currentWord
      .split('')
      .map((char, idx) => {
        if (char === ' ' || char === '-') return char;
        return this.revealedIndices.has(idx) ? char : '_';
      })
      .join(' ');
  }

  startGame() {
    if (this.players.length < 2) return false;
    this.state = 'CHOOSING_WORD';
    this.currentRound = 1;
    this.currentTurnIndex = -1;
    this.players.forEach(p => {
      p.score = 0;
      p.turnScore = 0;
      p.guessed = false;
    });
    this.updateRanks();
    this.startNextTurn();
    return true;
  }

  startNextTurn() {
    this.clearTimer();
    this.currentTurnIndex++;

    // Check if round is complete
    if (this.currentTurnIndex >= this.players.length) {
      this.currentTurnIndex = 0;
      this.currentRound++;
      if (this.currentRound > this.settings.rounds) {
        this.endGame();
        return;
      }
    }

    const drawer = this.players[this.currentTurnIndex];
    if (!drawer) {
      this.endGame();
      return;
    }

    this.currentDrawerId = drawer.id;
    this.currentWord = '';
    this.wordOptions = getRandomWords(this.settings.wordCount || 3, this.settings.customWords);
    this.revealedIndices = new Set();
    this.drawingHistory = [];
    this.turnReason = '';
    this.state = 'CHOOSING_WORD';

    // Reset guess status
    this.players.forEach(p => {
      p.guessed = false;
      p.turnScore = 0;
    });

    // 15 seconds to choose a word
    this.timeRemaining = 15;
    this.broadcastState();

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        // Auto select first word if time expired
        this.selectWord(this.wordOptions[0]);
      } else {
        this.io.to(this.id).emit('timer_tick', { timeRemaining: this.timeRemaining });
      }
    }, 1000);
  }

  selectWord(word) {
    if (this.state !== 'CHOOSING_WORD') return;
    this.clearTimer();

    this.currentWord = word.trim().toLowerCase();
    this.revealedIndices = new Set();
    this.state = 'DRAWING';
    this.drawingHistory = [];
    this.timeRemaining = this.settings.drawTime || 60;

    // Send notification
    const drawer = this.players.find(p => p.id === this.currentDrawerId);
    this.io.to(this.id).emit('chat_message', {
      type: 'system',
      subType: 'turn_start',
      text: `${drawer ? drawer.name : 'Drawer'} is drawing now!`
    });

    this.broadcastState();

    // Start drawing timer
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      // Hints progression
      this.checkAndRevealHint();

      if (this.timeRemaining <= 0) {
        this.turnReason = 'time_up';
        this.endTurn();
      } else {
        this.io.to(this.id).emit('timer_tick', {
          timeRemaining: this.timeRemaining,
          wordMask: this.getMaskedWord()
        });
      }
    }, 1000);
  }

  checkAndRevealHint() {
    if (!this.currentWord || (this.settings.hints || 0) <= 0) return;

    const maxHints = this.settings.hints;
    const totalTime = this.settings.drawTime || 60;
    const hintInterval = totalTime / (maxHints + 1);

    // Calculate how many hints should be revealed at this point
    const elapsed = totalTime - this.timeRemaining;
    const expectedHints = Math.min(maxHints, Math.floor(elapsed / hintInterval));

    if (this.revealedIndices.size < expectedHints) {
      // Find unrevealed letters
      const availableIndices = [];
      for (let i = 0; i < this.currentWord.length; i++) {
        if (this.currentWord[i] !== ' ' && this.currentWord[i] !== '-' && !this.revealedIndices.has(i)) {
          availableIndices.push(i);
        }
      }

      // Keep at least 1-2 letters hidden
      if (availableIndices.length > 1) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        this.revealedIndices.add(randomIndex);
        this.io.to(this.id).emit('hint_revealed', {
          wordMask: this.getMaskedWord()
        });
      }
    }
  }

  handleGuess(playerId, guess) {
    if (this.state !== 'DRAWING') return null;
    if (playerId === this.currentDrawerId) return null; // Drawer cannot guess

    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const cleanGuess = guess.trim().toLowerCase();
    const cleanWord = this.currentWord.trim().toLowerCase();

    // If player already guessed, message is only visible to other players who guessed
    if (player.guessed) {
      return {
        type: 'already_guessed',
        player: player,
        text: guess
      };
    }

    // Check exact match
    if (cleanGuess === cleanWord) {
      player.guessed = true;

      // Speed-based scoring (max 500 points, min 100 points based on time left)
      const maxPoints = 500;
      const minPoints = 100;
      const fraction = Math.max(0.1, this.timeRemaining / (this.settings.drawTime || 60));
      const points = Math.round(minPoints + (maxPoints - minPoints) * fraction);

      player.turnScore = points;
      player.score += points;

      // Award drawer bonus points (50 points per correct guess)
      const drawer = this.players.find(p => p.id === this.currentDrawerId);
      if (drawer) {
        const drawerBonus = 50;
        drawer.turnScore += drawerBonus;
        drawer.score += drawerBonus;
      }

      this.updateRanks();
      this.broadcastState();

      this.io.to(this.id).emit('chat_message', {
        type: 'system',
        subType: 'correct_guess',
        text: `${player.name} guessed the word!`,
        playerId: player.id
      });

      this.checkAllGuessed();

      return {
        type: 'correct',
        player: player,
        points: points
      };
    }

    // Check close guess (Levenshtein distance <= 2 for words >= 4 letters)
    if (cleanWord.length >= 4 && levenshteinDistance(cleanGuess, cleanWord) <= 2) {
      this.io.to(player.socketId).emit('chat_message', {
        type: 'system',
        subType: 'close_guess',
        text: `'${cleanGuess}' is close!`
      });
    }

    // Normal chat message
    return {
      type: 'normal',
      player: player,
      text: guess
    };
  }

  checkAllGuessed() {
    const guessers = this.players.filter(p => p.id !== this.currentDrawerId);
    if (guessers.length > 0 && guessers.every(p => p.guessed)) {
      this.turnReason = 'guessed_all';
      this.endTurn();
    }
  }

  endTurn() {
    this.clearTimer();
    this.state = 'TURN_END';
    this.broadcastState();

    // 5 seconds delay to show revealed word and scores
    this.timeRemaining = 5;
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.clearTimer();
        this.startNextTurn();
      } else {
        this.io.to(this.id).emit('timer_tick', { timeRemaining: this.timeRemaining });
      }
    }, 1000);
  }

  endGame() {
    this.clearTimer();
    this.state = 'GAME_OVER';
    this.updateRanks();
    this.broadcastState();
  }

  resetToLobby() {
    this.clearTimer();
    this.state = 'LOBBY';
    this.currentRound = 1;
    this.currentTurnIndex = -1;
    this.currentDrawerId = null;
    this.currentWord = '';
    this.wordOptions = [];
    this.drawingHistory = [];
    this.players.forEach(p => {
      p.score = 0;
      p.turnScore = 0;
      p.guessed = false;
    });
    this.updateRanks();
    this.broadcastState();
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(isPrivate = true) {
    const id = this.generateRoomCode();
    const room = new Room(id, isPrivate, this.io);
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id) {
    if (!id) return null;
    return this.rooms.get(id.toUpperCase().trim()) || null;
  }

  findAvailablePublicRoom() {
    for (const room of this.rooms.values()) {
      if (!room.isPrivate && room.state === 'LOBBY' && room.players.length < room.settings.maxPlayers) {
        return room;
      }
    }
    // If none found, create a new public room
    return this.createRoom(false);
  }

  cleanupRoom(id) {
    const room = this.rooms.get(id);
    if (room && room.players.length === 0) {
      room.clearTimer();
      this.rooms.delete(id);
    }
  }
}
