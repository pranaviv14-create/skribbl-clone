import React from 'react';
import { Player } from '../types';
import { Avatar } from './Avatar';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  recentMessages?: Record<string, string>; // playerId -> message text for speech bubbles
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayerId,
  recentMessages = {}
}) => {
  return (
    <div className="w-[190px] md:w-[210px] flex flex-col rounded-[3px] overflow-hidden select-none shadow-[0_2px_4px_rgba(0,0,0,0.25)] border border-gray-300">
      {/* Scrollable Player List */}
      <div className="flex flex-col bg-white overflow-y-auto max-h-[580px]">
        {players.map((player, idx) => {
          const isMe = player.id === currentPlayerId;
          const isGuessed = player.guessed;
          const isOdd = idx % 2 === 1;

          // Skribbl exact player background colors
          let bgColor = isOdd ? 'bg-[#ececec]' : 'bg-white';
          if (isGuessed) {
            bgColor = isOdd ? 'bg-[#48c737]' : 'bg-[#5bdd4a]';
          }

          let nameColor = 'text-gray-900';
          if (isMe) {
            nameColor = isGuessed ? 'text-[#0048b5] font-black' : 'text-[#4998ff] font-black';
          } else if (isGuessed) {
            nameColor = 'text-gray-900 font-bold';
          }

          const message = recentMessages[player.id];

          return (
            <div
              key={player.id}
              className={`relative h-[48px] px-2 flex items-center justify-between transition-colors border-b border-black/5 ${bgColor}`}
            >
              {/* Rank */}
              <div className="w-6 text-center font-black text-xs text-gray-500">
                #{player.rank || idx + 1}
              </div>

              {/* Player Info (Name & Score) */}
              <div className="flex-1 px-1.5 overflow-hidden">
                <div className={`text-xs md:text-sm truncate leading-tight ${nameColor}`}>
                  {player.name} {isMe && '(You)'}
                </div>
                <div className="text-[11px] font-extrabold text-gray-600 leading-tight">
                  {player.score} pts
                  {player.turnScore > 0 && (
                    <span className="text-[#005510] ml-1 font-black">
                      (+{player.turnScore})
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar on the right */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <Avatar
                  avatar={player.avatar}
                  size={38}
                  isHost={player.isHost}
                  isDrawing={player.isDrawing}
                />
              </div>

              {/* Skribbl Speech Bubble Popup */}
              {message && (
                <div className="absolute left-[102%] z-50 flex items-center pointer-events-none drop-shadow-md animate-in fade-in zoom-in duration-150">
                  {/* Triangle indicator */}
                  <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#e4e4e4]" />
                  {/* Bubble content */}
                  <div className="bg-[#e4e4e4] text-black font-extrabold text-xs px-2.5 py-1 rounded-[3px] whitespace-nowrap max-w-[180px] truncate border border-gray-300">
                    {message}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
