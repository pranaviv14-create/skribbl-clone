import React, { useState } from 'react';
import { SkribblLogo } from './SkribblLogo';
import { Avatar } from './Avatar';
import { AvatarConfig } from '../types';
import { AVATAR_COLORS, EYES_COUNT, MOUTH_COUNT } from '../constants';
import { sounds } from '../sounds';
import { Dices, ChevronLeft, ChevronRight, BookOpen, Newspaper, HelpCircle } from 'lucide-react';

interface MainMenuProps {
  name: string;
  setName: (name: string) => void;
  avatar: AvatarConfig;
  setAvatar: (avatar: AvatarConfig) => void;
  onPlayPublic: () => void;
  onCreatePrivate: () => void;
  onJoinPrivate: (roomCode: string) => void;
  isConnecting: boolean;
  errorMessage?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  name,
  setName,
  avatar,
  setAvatar,
  onPlayPublic,
  onCreatePrivate,
  onJoinPrivate,
  isConnecting,
  errorMessage
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  // Randomize avatar
  const handleRandomize = () => {
    sounds.playPop();
    setAvatar({
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      eyes: Math.floor(Math.random() * EYES_COUNT),
      mouth: Math.floor(Math.random() * MOUTH_COUNT)
    });
  };

  const cycleColor = (delta: number) => {
    sounds.playPop();
    const currIdx = AVATAR_COLORS.indexOf(avatar.color);
    let nextIdx = (currIdx + delta + AVATAR_COLORS.length) % AVATAR_COLORS.length;
    setAvatar({ ...avatar, color: AVATAR_COLORS[nextIdx] });
  };

  const cycleEyes = (delta: number) => {
    sounds.playPop();
    let next = (avatar.eyes + delta + EYES_COUNT) % EYES_COUNT;
    setAvatar({ ...avatar, eyes: next });
  };

  const cycleMouth = (delta: number) => {
    sounds.playPop();
    let next = (avatar.mouth + delta + MOUTH_COUNT) % MOUTH_COUNT;
    setAvatar({ ...avatar, mouth: next });
  };

  // 8 playful avatars under logo
  const bannerAvatars: AvatarConfig[] = [
    { color: '#ef130b', eyes: 0, mouth: 0 },
    { color: '#ffe400', eyes: 2, mouth: 1 },
    { color: '#00cc00', eyes: 1, mouth: 3 },
    { color: '#00b2ff', eyes: 4, mouth: 2 },
    { color: '#a300ba', eyes: 5, mouth: 5 },
    { color: '#ff7100', eyes: 6, mouth: 6 },
    { color: '#df69a7', eyes: 7, mouth: 8 },
    { color: '#ffac8e', eyes: 9, mouth: 9 },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between py-6 px-4 text-white">
      {/* Header & Logo Area */}
      <div className="flex flex-col items-center mt-2 mb-4">
        <SkribblLogo size="lg" />

        {/* Row of playful bouncing preview avatars */}
        <div className="flex gap-3 mt-3 items-center justify-center">
          {bannerAvatars.map((av, idx) => (
            <div
              key={idx}
              className="cursor-pointer transition-transform hover:scale-125 hover:-translate-y-1"
              onClick={() => {
                sounds.playPop();
                setAvatar({ ...av });
              }}
              title="Click to copy this avatar!"
            >
              <Avatar avatar={av} size={36} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Center Panel (Original Skribbl Style) */}
      <div className="w-full max-w-[420px] bg-[#0c2c96bf] rounded-[4px] p-5 shadow-2xl border border-[#040a33] flex flex-col gap-3">
        {errorMessage && (
          <div className="bg-[#ef130b] text-white p-2 text-center rounded-[3px] text-sm font-bold shadow">
            {errorMessage}
          </div>
        )}

        {/* Name Input & Language Selector */}
        <div className="flex gap-2 w-full">
          <input
            type="text"
            className="flex-1 h-[42px] px-3 font-bold text-gray-800 bg-white rounded-[3px] border-2 border-transparent focus:border-[#56b2fd] outline-none text-base placeholder-gray-400"
            placeholder="Enter your name"
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) onPlayPublic();
            }}
          />
          <select className="h-[42px] px-2 font-bold text-gray-800 bg-white rounded-[3px] border-2 border-transparent outline-none text-sm cursor-pointer">
            <option>English</option>
            <option>Español</option>
            <option>Deutsch</option>
            <option>Français</option>
          </select>
        </div>

        {/* Avatar Customizer Box */}
        <div className="relative bg-black/20 rounded-[3px] p-3 flex items-center justify-center border border-white/5">
          {/* Randomize Button (Dice) */}
          <button
            type="button"
            onClick={handleRandomize}
            className="absolute top-2 right-2 p-1.5 text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all bg-white/10 hover:bg-white/20 rounded-[3px]"
            title="Randomize your Avatar!"
          >
            <Dices size={20} />
          </button>

          {/* Left Arrow Controls */}
          <div className="flex flex-col justify-around h-[96px] mr-4">
            <button
              onClick={() => cycleColor(-1)}
              className="p-1 hover:bg-white/20 rounded text-white/90 active:scale-90"
              title="Previous Color"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => cycleEyes(-1)}
              className="p-1 hover:bg-white/20 rounded text-white/90 active:scale-90"
              title="Previous Eyes"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => cycleMouth(-1)}
              className="p-1 hover:bg-white/20 rounded text-white/90 active:scale-90"
              title="Previous Mouth"
            >
              <ChevronLeft size={22} />
            </button>
          </div>

          {/* Avatar Centerpiece */}
          <div className="w-[96px] h-[96px] flex items-center justify-center">
            <Avatar avatar={avatar} size={96} />
          </div>

          {/* Right Arrow Controls */}
          <div className="flex flex-col justify-around h-[96px] ml-4">
            <button
              onClick={() => cycleColor(1)}
              className="p-1 hover:bg-white/20 rounded text-white/90 active:scale-90"
              title="Next Color"
            >
              <ChevronRight size={22} />
            </button>
            <button
              onClick={() => cycleEyes(1)}
              className="p-1 hover:bg-white/20 rounded text-white/90 active:scale-90"
              title="Next Eyes"
            >
              <ChevronRight size={22} />
            </button>
            <button
              onClick={() => cycleMouth(1)}
              className="p-1 hover:bg-white/20 rounded text-white/90 active:scale-90"
              title="Next Mouth"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Big Green Play Button (Skribbl style) */}
        <button
          type="button"
          disabled={isConnecting || !name.trim()}
          onClick={() => {
            sounds.playPop();
            onPlayPublic();
          }}
          className="w-full h-[54px] bg-[#53e237] hover:bg-[#38c41c] active:bg-[#30aa19] disabled:opacity-50 text-white font-extrabold text-2xl tracking-wide rounded-[3px] shadow-[0_4px_0_#2b8214] active:shadow-none active:translate-y-1 transition-all cursor-pointer select-none flex items-center justify-center gap-2"
        >
          {isConnecting ? 'Connecting...' : 'Play!'}
        </button>

        {/* Blue Create Private Room Button */}
        <button
          type="button"
          disabled={isConnecting || !name.trim()}
          onClick={() => {
            sounds.playPop();
            onCreatePrivate();
          }}
          className="w-full h-[42px] bg-[#2c8de7] hover:bg-[#1671c5] active:bg-[#1361a9] disabled:opacity-50 text-white font-bold text-base rounded-[3px] shadow-[0_3px_0_#125596] active:shadow-none active:translate-y-1 transition-all cursor-pointer select-none"
        >
          Create Private Room
        </button>

        {/* Join Private Room Section */}
        {!showJoinInput ? (
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setShowJoinInput(true);
            }}
            className="text-xs text-blue-200 hover:text-white underline text-center mt-1 py-1"
          >
            Have a room code? Click here to join
          </button>
        ) : (
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Room Code (e.g. 5XYZ)"
              className="flex-1 h-[38px] px-3 font-bold text-gray-800 bg-white rounded-[3px] uppercase text-sm outline-none border-2 border-transparent focus:border-[#56b2fd]"
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && joinCode.trim() && name.trim()) {
                  sounds.playPop();
                  onJoinPrivate(joinCode);
                }
              }}
            />
            <button
              type="button"
              disabled={!joinCode.trim() || !name.trim() || isConnecting}
              onClick={() => {
                sounds.playPop();
                onJoinPrivate(joinCode);
              }}
              className="h-[38px] px-4 bg-[#ffe400] hover:bg-[#e8a200] text-gray-900 font-extrabold text-sm rounded-[3px] shadow-[0_3px_0_#9a6d00] active:translate-y-1 active:shadow-none transition-all"
            >
              Join
            </button>
          </div>
        )}
      </div>

      {/* Footer Info Panels (Classic Skribbl bottom 3-column layout) */}
      <div className="w-full max-w-[1020px] mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* About Panel */}
        <div className="bg-[#0c2c96bf] rounded-[3px] p-4 border border-[#040a33] text-gray-200">
          <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
            <BookOpen size={18} className="text-[#00ff91]" />
            <h3>About</h3>
          </div>
          <p className="leading-relaxed">
            <b className="text-white">skribbl.io</b> is a free online multiplayer drawing and guessing game. A round consists of players taking turns drawing a chosen word while others guess in real time to score points!
          </p>
        </div>

        {/* How to Play Panel */}
        <div className="bg-[#0c2c96bf] rounded-[3px] p-4 border border-[#040a33] text-gray-200">
          <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
            <HelpCircle size={18} className="text-[#ffe400]" />
            <h3>How to Play</h3>
          </div>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li>Choose 1 of 3 words when it's your turn to draw.</li>
            <li>Draw your word on the canvas without spelling letters!</li>
            <li>When guessing, type your guesses into the chat.</li>
            <li>Faster guesses earn more points!</li>
          </ul>
        </div>

        {/* Features / Updates Panel */}
        <div className="bg-[#0c2c96bf] rounded-[3px] p-4 border border-[#040a33] text-gray-200">
          <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
            <Newspaper size={18} className="text-[#ff7100]" />
            <h3>Features</h3>
          </div>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li>500+ hand-curated pictionary words.</li>
            <li>Real-time 800x600 smooth vector drawing.</li>
            <li>Instant bucket flood fill &amp; undo stack.</li>
            <li>Speed-based scoring and podium ceremony!</li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Disclaimer */}
      <div className="text-center text-xs text-blue-300/80 mt-6">
        Free Multiplayer Drawing &amp; Guessing Game inspired by skribbl.io
      </div>
    </div>
  );
};
