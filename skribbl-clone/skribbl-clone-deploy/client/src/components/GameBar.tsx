import React from 'react';
import { GameState } from '../types';
import { Clock, Volume2, VolumeX, LogOut } from 'lucide-react';
import { sounds } from '../sounds';

interface GameBarProps {
  state: GameState;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  isDrawing: boolean;
  drawerName?: string;
  displayWord: string;
  wordLength: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLeaveRoom: () => void;
}

export const GameBar: React.FC<GameBarProps> = ({
  state,
  currentRound,
  totalRounds,
  timeRemaining,
  isDrawing,
  drawerName,
  displayWord,
  wordLength,
  soundEnabled,
  onToggleSound,
  onLeaveRoom
}) => {
  const isTimeCritical = timeRemaining <= 10 && state === 'DRAWING';

  return (
    <div className="h-[48px] w-full bg-white rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-between px-3 select-none border border-gray-300">
      {/* Left Area: Clock & Round Indicator */}
      <div className="flex items-center gap-3">
        {/* Animated Clock */}
        <div
          className={`flex items-center justify-center gap-1 font-black text-lg px-2 py-0.5 rounded-[3px] min-w-[58px] transition-colors ${
            isTimeCritical
              ? 'bg-[#ef130b] text-white animate-pulse'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <Clock size={18} className={isTimeCritical ? 'text-white' : 'text-gray-600'} />
          <span>{timeRemaining}</span>
        </div>

        {/* Round Counter */}
        <div className="text-xs md:text-sm font-extrabold text-gray-700 uppercase tracking-tight">
          Round {currentRound} of {totalRounds}
        </div>
      </div>

      {/* Center Word Area (The core focal point) */}
      <div className="flex flex-col items-center justify-center flex-1 mx-2">
        {state === 'LOBBY' && (
          <div className="font-bold text-gray-600 text-sm">Waiting for players to join...</div>
        )}

        {state === 'CHOOSING_WORD' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
              {isDrawing ? 'YOUR TURN:' : 'CHOOSING:'}
            </span>
            <span className="font-extrabold text-[#1640c9] text-base animate-pulse">
              {isDrawing ? 'Choose a word to draw!' : `${drawerName || 'Player'} is choosing a word...`}
            </span>
          </div>
        )}

        {state === 'DRAWING' && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider leading-none">
              {isDrawing ? 'DRAW THIS' : 'GUESS THIS'}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg md:text-xl tracking-[0.25em] text-gray-900 uppercase">
                {displayWord}
              </span>
              {!isDrawing && wordLength > 0 && (
                <span className="text-xs font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {wordLength}
                </span>
              )}
            </div>
          </div>
        )}

        {(state === 'TURN_END' || state === 'GAME_OVER') && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">THE WORD WAS:</span>
            <span className="font-black text-lg text-[#00cc00] uppercase tracking-wider">
              {displayWord}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            sounds.playPop();
            onToggleSound();
          }}
          className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-[3px] text-gray-700 transition-colors"
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} className="text-red-500" />}
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            if (confirm('Leave current room and return to main menu?')) {
              onLeaveRoom();
            }
          }}
          className="p-1.5 hover:bg-red-50 active:bg-red-100 rounded-[3px] text-red-600 transition-colors"
          title="Leave Room"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};
