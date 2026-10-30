import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AvatarConfig,
  RoomState,
  ChatMessage,
  DrawStroke,
  FillCommand,
  HistoryItem
} from './types';
import { AVATAR_COLORS } from './constants';
import { MainMenu } from './components/MainMenu';
import { GameBar } from './components/GameBar';
import { PlayerList } from './components/PlayerList';
import { Canvas } from './components/Canvas';
import { DrawingToolbar, ToolType } from './components/DrawingToolbar';
import { ChatPanel } from './components/ChatPanel';
import { sounds } from './sounds';

export const App: React.FC = () => {
  // User Profile
  const [name, setName] = useState<string>(() => {
    return localStorage.getItem('skribbl_name') || `Player_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('skribbl_avatar');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      eyes: 0,
      mouth: 0
    };
  });

  const [playerId] = useState<string>(() => {
    let pid = sessionStorage.getItem('skribbl_pid');
    if (!pid) {
      pid = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('skribbl_pid', pid);
    }
    return pid;
  });

  // Socket & Game State
  const socketRef = useRef<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentSpeech, setRecentSpeech] = useState<Record<string, string>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Drawing Tools State
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(10);
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Save profile changes
  useEffect(() => {
    localStorage.setItem('skribbl_name', name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem('skribbl_avatar', JSON.stringify(avatar));
  }, [avatar]);

  // Connect socket
  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://skribbl-backend-xh2u.onrender.com';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Skribbl socket server');
      setIsConnecting(false);
    });

    socket.on('joined_room', () => {
      setErrorMessage('');
      setIsConnecting(false);
      setMessages([]);
    });

    socket.on('room_state', (state: RoomState) => {
      setRoomState(state);
    });

    socket.on('timer_tick', (data: { timeRemaining: number; wordMask?: string }) => {
      setRoomState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          timeRemaining: data.timeRemaining,
          displayWord: data.wordMask !== undefined ? data.wordMask : prev.displayWord
        };
      });

      if (data.timeRemaining <= 5 && data.timeRemaining > 0) {
        sounds.playClockTick();
      }
    });

    socket.on('hint_revealed', (data: { wordMask: string }) => {
      setRoomState((prev) => (prev ? { ...prev, displayWord: data.wordMask } : null));
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);

      // Sound triggers
      if (msg.subType === 'correct_guess') {
        sounds.playCorrectGuess();
      } else if (msg.subType === 'close_guess') {
        sounds.playCloseGuess();
      } else if (msg.subType === 'turn_start') {
        sounds.playTurnStart();
      }

      // Show speech bubble for user chat
      if (msg.playerId && msg.text) {
        setRecentSpeech((prev) => ({ ...prev, [msg.playerId!]: msg.text }));
        setTimeout(() => {
          setRecentSpeech((prev) => {
            const next = { ...prev };
            delete next[msg.playerId!];
            return next;
          });
        }, 2500);
      }
    });

    socket.on('error_message', (data: { message: string }) => {
      setErrorMessage(data.message);
      setIsConnecting(false);
    });

    // Remote Drawing synchronization
    socket.on('draw_stroke', (stroke: DrawStroke) => {
      drawRemoteStroke(stroke);
    });

    socket.on('fill_bucket', (fill: FillCommand) => {
      executeFloodFill(fill.x, fill.y, fill.color);
    });

    socket.on('clear_canvas', () => {
      clearCanvasLocally();
    });

    socket.on('redraw_canvas', (history: HistoryItem[]) => {
      replayDrawingHistory(history);
    });

    socket.on('drawing_history', (history: HistoryItem[]) => {
      replayDrawingHistory(history);
    });

    return () => {
      socket.disconnect();
    };
  }, [playerId]);

  // Check URL room code (e.g. ?room=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomState && socketRef.current) {
      socketRef.current.emit('join_room', {
        roomId: roomParam.toUpperCase().trim(),
        playerId,
        name,
        avatar
      });
    }
  }, [playerId, name, avatar, roomState]);

  // Canvas drawing utilities
  const drawRemoteStroke = (stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (stroke.prevX === stroke.x && stroke.prevY === stroke.y && !stroke.isEnd) {
      ctx.beginPath();
      ctx.arc(stroke.x, stroke.y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.prevX, stroke.prevY);
      ctx.lineTo(stroke.x, stroke.y);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const executeFloodFill = (startX: number, startY: number, fillHex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, 800, 600);
    const data = imgData.data;

    const fillR = parseInt(fillHex.slice(1, 3), 16);
    const fillG = parseInt(fillHex.slice(3, 5), 16);
    const fillB = parseInt(fillHex.slice(5, 7), 16);

    const startIndex = (startY * 800 + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const colorMatch = (idx: number) => {
      return (
        Math.abs(data[idx] - targetR) < 15 &&
        Math.abs(data[idx + 1] - targetG) < 15 &&
        Math.abs(data[idx + 2] - targetB) < 15 &&
        Math.abs(data[idx + 3] - targetA) < 15
      );
    };

    const queue: number[] = [startX, startY];
    const visited = new Uint8Array(800 * 600);
    visited[startY * 800 + startX] = 1;

    while (queue.length > 0) {
      const curY = queue.pop()!;
      const curX = queue.pop()!;
      const idx = (curY * 800 + curX) * 4;

      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = 255;

      const neighbors = [
        [curX + 1, curY],
        [curX - 1, curY],
        [curX, curY + 1],
        [curX, curY - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < 800 && ny >= 0 && ny < 600) {
          const nPos = ny * 800 + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            if (colorMatch(nPos * 4)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const clearCanvasLocally = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);
  };

  const replayDrawingHistory = (history: HistoryItem[]) => {
    clearCanvasLocally();
    for (const item of history) {
      if (item.type === 'stroke') {
        drawRemoteStroke(item.data);
      } else if (item.type === 'fill') {
        executeFloodFill(item.data.x, item.data.y, item.data.color);
      } else if (item.type === 'clear') {
        clearCanvasLocally();
      }
    }
  };

  // User Actions
  const handlePlayPublic = () => {
    setIsConnecting(true);
    socketRef.current?.emit('join_public', { playerId, name, avatar });
  };

  const handleCreatePrivate = () => {
    setIsConnecting(true);
    socketRef.current?.emit('create_room', { playerId, name, avatar });
  };

  const handleJoinPrivate = (roomCode: string) => {
    setIsConnecting(true);
    socketRef.current?.emit('join_room', {
      roomId: roomCode.toUpperCase().trim(),
      playerId,
      name,
      avatar
    });
  };

  const handleStartGame = () => {
    if (!roomState) return;
    socketRef.current?.emit('start_game', { roomId: roomState.id });
  };

  const handleUpdateSettings = (settings: Record<string, unknown>) => {
    if (!roomState) return;
    socketRef.current?.emit('update_settings', { roomId: roomState.id, settings });
  };

  const handleSelectWord = (word: string) => {
    if (!roomState) return;
    socketRef.current?.emit('select_word', { roomId: roomState.id, word });
  };

  const handleEmitStroke = (stroke: DrawStroke) => {
    if (!roomState) return;
    socketRef.current?.emit('draw_stroke', { roomId: roomState.id, stroke });
  };

  const handleEmitFill = (fill: FillCommand) => {
    if (!roomState) return;
    socketRef.current?.emit('fill_bucket', { roomId: roomState.id, fill });
  };

  const handleClearCanvas = () => {
    if (!roomState) return;
    clearCanvasLocally();
    socketRef.current?.emit('clear_canvas', { roomId: roomState.id });
  };

  const handleUndo = () => {
    if (!roomState) return;
    socketRef.current?.emit('undo_stroke', { roomId: roomState.id });
  };

  const handleSendMessage = (text: string) => {
    if (!roomState) return;
    socketRef.current?.emit('send_chat', {
      roomId: roomState.id,
      playerId,
      text
    });
  };

  const handlePlayAgain = () => {
    if (!roomState) return;
    socketRef.current?.emit('play_again', { roomId: roomState.id });
  };

  const handleLeaveRoom = () => {
    window.location.href = window.location.pathname;
  };

  // Check roles
  const me = roomState?.players.find((p) => p.id === playerId);
  const isDrawer = roomState?.currentDrawerId === playerId;
  const canDraw = isDrawer && roomState?.state === 'DRAWING';
  const drawer = roomState?.players.find((p) => p.id === roomState.currentDrawerId);
  const hasGuessed = me?.guessed || false;

  // Render Main Menu if not in room
  if (!roomState) {
    return (
      <div className="w-full min-h-screen bg-[#124da5] bg-repeat bg-[radial-gradient(#1e5ebc_1px,transparent_1px)] [background-size:20px_20px] font-['Nunito',sans-serif]">
        <MainMenu
          name={name}
          setName={setName}
          avatar={avatar}
          setAvatar={setAvatar}
          onPlayPublic={handlePlayPublic}
          onCreatePrivate={handleCreatePrivate}
          onJoinPrivate={handleJoinPrivate}
          isConnecting={isConnecting}
          errorMessage={errorMessage}
        />
      </div>
    );
  }

  // Render Game Screen
  return (
    <div className="w-full min-h-screen bg-[#124da5] bg-[radial-gradient(#1e5ebc_1px,transparent_1px)] [background-size:20px_20px] font-['Nunito',sans-serif] p-2 md:p-4 flex flex-col items-center justify-center">
      {/* Container matching desktop skribbl grid */}
      <div className="w-full max-w-[1360px] flex flex-col gap-2">
        {/* Top Game Bar */}
        <GameBar
          state={roomState.state}
          currentRound={roomState.currentRound}
          totalRounds={roomState.settings.rounds}
          timeRemaining={roomState.timeRemaining}
          isDrawing={isDrawer}
          drawerName={drawer?.name}
          displayWord={roomState.displayWord}
          wordLength={roomState.wordLength}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            sounds.enabled = next;
          }}
          onLeaveRoom={handleLeaveRoom}
        />

        {/* Middle Main Section: Left Players, Center Canvas + Tools, Right Chat */}
        <div className="flex flex-col lg:flex-row gap-2 items-stretch justify-center">
          {/* Left Player List */}
          <div className="flex-shrink-0">
            <PlayerList
              players={roomState.players}
              currentPlayerId={playerId}
              recentMessages={recentSpeech}
            />
          </div>

          {/* Center Column: Canvas + Drawing Toolbar */}
          <div className="flex-1 flex flex-col gap-2 items-center max-w-[800px]">
            <Canvas
              state={roomState.state}
              isDrawing={isDrawer}
              canDraw={canDraw}
              currentColor={currentColor}
              brushSize={brushSize}
              activeTool={activeTool}
              wordOptions={roomState.wordOptions}
              displayWord={roomState.displayWord}
              turnReason={roomState.turnReason}
              drawer={drawer}
              players={roomState.players}
              isHost={me?.isHost || false}
              roomId={roomState.id}
              settings={roomState.settings}
              onSelectWord={handleSelectWord}
              onStartGame={handleStartGame}
              onUpdateSettings={handleUpdateSettings}
              onPlayAgain={handlePlayAgain}
              onEmitStroke={handleEmitStroke}
              onEmitFill={handleEmitFill}
              canvasRef={canvasRef}
            />

            <DrawingToolbar
              currentColor={currentColor}
              onSelectColor={setCurrentColor}
              brushSize={brushSize}
              onSelectBrushSize={setBrushSize}
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              onUndo={handleUndo}
              onClear={handleClearCanvas}
              canDraw={canDraw}
            />
          </div>

          {/* Right Chat Panel */}
          <div className="flex-shrink-0">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isDrawing={isDrawer}
              hasGuessed={hasGuessed}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
