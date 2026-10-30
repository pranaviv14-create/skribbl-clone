import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, RoomSettings, Player, DrawStroke, FillCommand } from '../types';
import { ToolType } from './DrawingToolbar';
import { Avatar } from './Avatar';
import { sounds } from '../sounds';
import confetti from 'canvas-confetti';
import { Copy, Check, Play, Settings, Trophy, Sparkles } from 'lucide-react';

interface CanvasProps {
  state: GameState;
  isDrawing: boolean;
  canDraw: boolean;
  currentColor: string;
  brushSize: number;
  activeTool: ToolType;
  wordOptions: string[];
  displayWord: string;
  turnReason: string;
  drawer?: Player;
  players: Player[];
  isHost: boolean;
  roomId: string;
  settings: RoomSettings;
  onSelectWord: (word: string) => void;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onPlayAgain: () => void;
  onEmitStroke: (stroke: DrawStroke) => void;
  onEmitFill: (fill: FillCommand) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const Canvas: React.FC<CanvasProps> = ({
  state,
  isDrawing,
  canDraw,
  currentColor,
  brushSize,
  activeTool,
  wordOptions,
  displayWord,
  turnReason,
  drawer,
  players,
  isHost,
  roomId,
  settings,
  onSelectWord,
  onStartGame,
  onUpdateSettings,
  onPlayAgain,
  onEmitStroke,
  onEmitFill,
  canvasRef
}) => {
  const isPaintingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Trigger celebratory confetti on GAME_OVER
  useEffect(() => {
    if (state === 'GAME_OVER') {
      sounds.playGameEnd();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [state]);

  // Convert client mouse/touch coordinates to internal 800x600 coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return null;
    }

    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;

    const x = Math.round((clientX - rect.left) * scaleX);
    const y = Math.round((clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(800, x)),
      y: Math.max(0, Math.min(600, y))
    };
  };

  // High-performance 4-way BFS Flood Fill
  const performFloodFill = useCallback((startX: number, startY: number, fillHex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, 800, 600);
    const data = imgData.data;

    // Convert hex to RGB
    const fillR = parseInt(fillHex.slice(1, 3), 16);
    const fillG = parseInt(fillHex.slice(3, 5), 16);
    const fillB = parseInt(fillHex.slice(5, 7), 16);

    const startIndex = (startY * 800 + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // If target already matches fill color, skip
    if (targetR === fillR && targetG === fillG && targetB === fillB) {
      return;
    }

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
  }, [canvasRef]);

  // Handle local drawing actions
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    if (activeTool === 'fill') {
      performFloodFill(coords.x, coords.y, currentColor);
      onEmitFill({ x: coords.x, y: coords.y, color: currentColor });
      return;
    }

    isPaintingRef.current = true;
    lastPosRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : currentColor;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    onEmitStroke({
      prevX: coords.x,
      prevY: coords.y,
      x: coords.x,
      y: coords.y,
      color: strokeColor,
      size: brushSize,
      isEnd: false
    });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw || !isPaintingRef.current || !lastPosRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : currentColor;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    onEmitStroke({
      prevX: lastPosRef.current.x,
      prevY: lastPosRef.current.y,
      x: coords.x,
      y: coords.y,
      color: strokeColor,
      size: brushSize,
      isEnd: false
    });

    lastPosRef.current = coords;
  };

  const handlePointerUp = () => {
    if (!canDraw || !isPaintingRef.current) return;
    isPaintingRef.current = false;

    if (lastPosRef.current) {
      const strokeColor = activeTool === 'eraser' ? '#ffffff' : currentColor;
      onEmitStroke({
        prevX: lastPosRef.current.x,
        prevY: lastPosRef.current.y,
        x: lastPosRef.current.x,
        y: lastPosRef.current.y,
        color: strokeColor,
        size: brushSize,
        isEnd: true
      });
    }

    lastPosRef.current = null;
  };

  const copyRoomLink = () => {
    sounds.playPop();
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Top 3 players for podiums
  const topPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="relative w-full aspect-[4/3] max-w-[800px] max-h-[600px] bg-white rounded-[3px] shadow-[0_3px_6px_rgba(0,0,0,0.25)] border border-gray-300 overflow-hidden select-none">
      {/* Real HTML5 Drawing Canvas (Fixed 800x600 resolution) */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className={`w-full h-full block bg-white ${
          canDraw
            ? activeTool === 'fill'
              ? 'cursor-crosshair'
              : 'cursor-crosshair'
            : 'cursor-default'
        }`}
      />

      {/* OVERLAY 1: LOBBY OVERLAY (Before game starts) */}
      {state === 'LOBBY' && (
        <div className="absolute inset-0 bg-[#0c2c96df] text-white p-6 flex flex-col justify-between backdrop-blur-sm z-30">
          {/* Top Lobby Bar: Room Code & Copy Button */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <div>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Room Code
              </span>
              <span className="text-3xl font-black text-[#ffe400] tracking-widest">
                {roomId}
              </span>
            </div>

            <button
              onClick={copyRoomLink}
              className="flex items-center gap-2 bg-[#2c8de7] hover:bg-[#1671c5] px-4 py-2 rounded-[3px] font-bold text-sm shadow transition-all active:scale-95"
            >
              {copiedLink ? <Check size={18} /> : <Copy size={18} />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Invite Link'}</span>
            </button>
          </div>

          {/* Center: Lobby Game Settings */}
          <div className="grid grid-cols-2 gap-4 my-2 text-sm">
            <div className="bg-black/20 p-3 rounded-[3px] flex items-center justify-between">
              <span className="font-bold">Draw Time:</span>
              <select
                disabled={!isHost}
                value={settings.drawTime}
                onChange={(e) => onUpdateSettings({ drawTime: Number(e.target.value) })}
                className="bg-white text-gray-900 font-bold px-2 py-1 rounded-[2px] outline-none cursor-pointer disabled:opacity-60"
              >
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={80}>80 seconds</option>
                <option value={100}>100 seconds</option>
              </select>
            </div>

            <div className="bg-black/20 p-3 rounded-[3px] flex items-center justify-between">
              <span className="font-bold">Rounds:</span>
              <select
                disabled={!isHost}
                value={settings.rounds}
                onChange={(e) => onUpdateSettings({ rounds: Number(e.target.value) })}
                className="bg-white text-gray-900 font-bold px-2 py-1 rounded-[2px] outline-none cursor-pointer disabled:opacity-60"
              >
                <option value={2}>2 Rounds</option>
                <option value={3}>3 Rounds</option>
                <option value={4}>4 Rounds</option>
                <option value={5}>5 Rounds</option>
                <option value={8}>8 Rounds</option>
              </select>
            </div>

            <div className="bg-black/20 p-3 rounded-[3px] flex items-center justify-between">
              <span className="font-bold">Hints:</span>
              <select
                disabled={!isHost}
                value={settings.hints}
                onChange={(e) => onUpdateSettings({ hints: Number(e.target.value) })}
                className="bg-white text-gray-900 font-bold px-2 py-1 rounded-[2px] outline-none cursor-pointer disabled:opacity-60"
              >
                <option value={0}>No Hints</option>
                <option value={1}>1 Hint</option>
                <option value={2}>2 Hints</option>
                <option value={3}>3 Hints</option>
              </select>
            </div>

            <div className="bg-black/20 p-3 rounded-[3px] flex items-center justify-between">
              <span className="font-bold">Max Players:</span>
              <select
                disabled={!isHost}
                value={settings.maxPlayers}
                onChange={(e) => onUpdateSettings({ maxPlayers: Number(e.target.value) })}
                className="bg-white text-gray-900 font-bold px-2 py-1 rounded-[2px] outline-none cursor-pointer disabled:opacity-60"
              >
                <option value={4}>4 Players</option>
                <option value={8}>8 Players</option>
                <option value={12}>12 Players</option>
              </select>
            </div>
          </div>

          {/* Bottom Action: Start Game button */}
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/20">
            {isHost ? (
              <button
                disabled={players.length < 2}
                onClick={() => {
                  sounds.playPop();
                  onStartGame();
                }}
                className="w-full max-w-[320px] h-[52px] bg-[#53e237] hover:bg-[#38c41c] active:bg-[#30aa19] disabled:opacity-50 text-white font-black text-2xl tracking-wider rounded-[3px] shadow-[0_4px_0_#2b8214] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <Play size={24} fill="currentColor" />
                <span>Start Game!</span>
              </button>
            ) : (
              <div className="text-base font-extrabold text-[#ffe400] animate-pulse">
                Waiting for room host to start the game...
              </div>
            )}

            {players.length < 2 && isHost && (
              <span className="text-xs text-yellow-300 font-bold">
                (Need at least 2 players to start)
              </span>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY 2: WORD SELECTION (Drawer picks 1 of 3 words) */}
      {state === 'CHOOSING_WORD' && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 z-30 animate-in fade-in">
          {isDrawing ? (
            <div className="bg-[#0c2c96f0] border-2 border-[#1640c9] p-6 rounded-[4px] shadow-2xl flex flex-col items-center max-w-[500px] w-full">
              <h2 className="text-white text-2xl font-black mb-6 tracking-wide">
                Choose a word to draw:
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                {wordOptions.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playPop();
                      onSelectWord(word);
                    }}
                    className="flex-1 py-4 px-3 bg-[#53e237] hover:bg-[#38c41c] active:scale-95 text-white font-extrabold text-xl rounded-[3px] shadow-[0_4px_0_#2b8214] active:shadow-none transition-all uppercase tracking-wider text-center"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#0c2c96f0] p-6 rounded-[4px] shadow-2xl flex flex-col items-center">
              <span className="text-white text-xl font-black mb-2 animate-pulse">
                {drawer ? drawer.name : 'Player'} is choosing a word...
              </span>
              <div className="mt-3">
                <Avatar avatar={drawer?.avatar} size={72} isDrawing={true} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY 3: TURN REVEAL (End of turn word announcement) */}
      {state === 'TURN_END' && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 z-30 animate-in fade-in">
          <div className="bg-[#0c2c96f0] border border-[#1640c9] p-6 rounded-[4px] shadow-2xl flex flex-col items-center max-w-[460px] w-full text-white text-center">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-1">
              {turnReason === 'guessed_all'
                ? 'Everyone guessed the word!'
                : turnReason === 'drawer_left'
                ? 'Drawer left the game'
                : 'Time is up!'}
            </span>
            <div className="text-gray-200 text-base mb-1">The word was:</div>
            <div className="text-3xl md:text-4xl font-black text-[#53e237] uppercase tracking-wider mb-4 drop-shadow">
              {displayWord}
            </div>

            {/* Turn score summary */}
            <div className="w-full bg-black/20 p-3 rounded-[3px] max-h-[160px] overflow-y-auto flex flex-col gap-1 text-xs">
              {players
                .filter((p) => p.turnScore > 0)
                .map((p) => (
                  <div key={p.id} className="flex justify-between items-center font-bold px-2 py-1">
                    <span>{p.name}</span>
                    <span className="text-[#53e237]">+{p.turnScore} pts</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 4: GAME OVER / PODIUMS CEREMONY */}
      {state === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-[#0c2c96f5] flex flex-col items-center justify-between p-6 z-40 text-white animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Trophy size={32} className="text-[#ffe400]" />
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-[#ffe400]">
              Game Over!
            </h1>
          </div>

          {/* Authentic Skribbl 3-Tier Winner Podiums */}
          <div className="flex items-end justify-center gap-4 my-2 w-full max-w-[500px] h-[220px]">
            {/* 2nd Place (Left) */}
            {topPlayers[1] ? (
              <div className="flex flex-col items-center flex-1">
                <Avatar avatar={topPlayers[1].avatar} size={54} />
                <span className="text-xs font-bold truncate max-w-[90px] mt-1">
                  {topPlayers[1].name}
                </span>
                <span className="text-[10px] text-gray-300">{topPlayers[1].score} pts</span>
                <div className="w-full h-[90px] bg-[#9e9e9e] border-t-4 border-[#cfcfcf] rounded-t-[3px] flex items-center justify-center font-black text-2xl shadow-lg">
                  #2
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* 1st Place (Center - Highest) */}
            {topPlayers[0] && (
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  <Avatar avatar={topPlayers[0].avatar} size={68} isHost={true} />
                  <Sparkles size={20} className="absolute -top-3 -right-2 text-yellow-300 animate-spin" />
                </div>
                <span className="text-sm font-black text-yellow-300 truncate max-w-[110px] mt-1">
                  {topPlayers[0].name}
                </span>
                <span className="text-xs text-yellow-200 font-bold">{topPlayers[0].score} pts</span>
                <div className="w-full h-[130px] bg-[#ffe400] text-gray-900 border-t-4 border-[#fff176] rounded-t-[3px] flex items-center justify-center font-black text-4xl shadow-xl">
                  #1
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {topPlayers[2] ? (
              <div className="flex flex-col items-center flex-1">
                <Avatar avatar={topPlayers[2].avatar} size={48} />
                <span className="text-xs font-bold truncate max-w-[90px] mt-1">
                  {topPlayers[2].name}
                </span>
                <span className="text-[10px] text-gray-300">{topPlayers[2].score} pts</span>
                <div className="w-full h-[65px] bg-[#cd7f32] border-t-4 border-[#e4a468] rounded-t-[3px] flex items-center justify-center font-black text-xl shadow">
                  #3
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          {/* Action: Play Again / Return to Lobby */}
          <div>
            {isHost ? (
              <button
                onClick={() => {
                  sounds.playPop();
                  onPlayAgain();
                }}
                className="px-8 py-3 bg-[#53e237] hover:bg-[#38c41c] text-white font-black text-xl rounded-[3px] shadow-[0_4px_0_#2b8214] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide cursor-pointer"
              >
                Play Again!
              </button>
            ) : (
              <div className="text-sm font-bold text-yellow-300 animate-pulse">
                Waiting for host to restart game...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
