import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarProps {
  avatar?: AvatarConfig;
  size?: number | string;
  isHost?: boolean;
  isDrawing?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  avatar = { color: '#00cc00', eyes: 0, mouth: 0 },
  size = 48,
  isHost = false,
  isDrawing = false,
  className = '',
  onClick
}) => {
  const { color = '#00cc00', eyes = 0, mouth = 0 } = avatar;

  const renderEyes = () => {
    switch (eyes % 10) {
      case 1: // Squint ^ ^
        return (
          <g stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 32 44 Q 38 34 44 44" />
            <path d="M 56 44 Q 62 34 68 44" />
          </g>
        );
      case 2: // Big round eyes
        return (
          <g>
            <circle cx="37" cy="40" r="9" fill="#1a1a1a" />
            <circle cx="63" cy="40" r="9" fill="#1a1a1a" />
            <circle cx="39" cy="37" r="3.5" fill="#ffffff" />
            <circle cx="65" cy="37" r="3.5" fill="#ffffff" />
          </g>
        );
      case 3: // Wink (left wink, right open)
        return (
          <g>
            <path d="M 32 42 Q 38 48 44 42" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="63" cy="40" r="7" fill="#1a1a1a" />
            <circle cx="65" cy="37" r="2.5" fill="#ffffff" />
          </g>
        );
      case 4: // Cool Sunglasses
        return (
          <g fill="#1a1a1a">
            <path d="M 28 35 L 46 35 L 44 49 L 30 49 Z" rx="2" />
            <path d="M 54 35 L 72 35 L 70 49 L 56 49 Z" rx="2" />
            <rect x="44" y="38" width="12" height="3" fill="#1a1a1a" />
            <line x1="28" y1="36" x2="43" y2="47" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <line x1="54" y1="36" x2="69" y2="47" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
          </g>
        );
      case 5: // Anime Starry eyes
        return (
          <g fill="#ffe400" stroke="#1a1a1a" strokeWidth="2">
            <polygon points="38,32 40,38 46,38 41,42 43,48 38,44 33,48 35,42 30,38 36,38" />
            <polygon points="62,32 64,38 70,38 65,42 67,48 62,44 57,48 59,42 54,38 60,38" />
          </g>
        );
      case 6: // Angry > <
        return (
          <g stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 33 36 L 43 43 L 33 48" />
            <path d="M 67 36 L 57 43 L 67 48" />
          </g>
        );
      case 7: // Dot eyes
        return (
          <g fill="#1a1a1a">
            <circle cx="38" cy="42" r="4.5" />
            <circle cx="62" cy="42" r="4.5" />
          </g>
        );
      case 8: // Dizzy X X
        return (
          <g stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round">
            <line x1="33" y1="35" x2="43" y2="45" />
            <line x1="43" y1="35" x2="33" y2="45" />
            <line x1="57" y1="35" x2="67" y2="45" />
            <line x1="67" y1="35" x2="57" y2="45" />
          </g>
        );
      case 9: // Round Glasses
        return (
          <g stroke="#1a1a1a" strokeWidth="3" fill="none">
            <circle cx="37" cy="40" r="10" />
            <circle cx="63" cy="40" r="10" />
            <line x1="47" y1="40" x2="53" y2="40" />
            <circle cx="37" cy="40" r="4" fill="#1a1a1a" stroke="none" />
            <circle cx="63" cy="40" r="4" fill="#1a1a1a" stroke="none" />
          </g>
        );
      case 0:
      default: // Classic Skribbl Eyes
        return (
          <g>
            <circle cx="38" cy="40" r="6.5" fill="#1a1a1a" />
            <circle cx="62" cy="40" r="6.5" fill="#1a1a1a" />
            <circle cx="40" cy="38" r="2.5" fill="#ffffff" />
            <circle cx="64" cy="38" r="2.5" fill="#ffffff" />
          </g>
        );
    }
  };

  const renderMouth = () => {
    switch (mouth % 10) {
      case 1: // Open happy mouth with tongue
        return (
          <g>
            <path d="M 38 58 Q 50 78 62 58 Z" fill="#7a1414" stroke="#1a1a1a" strokeWidth="2.5" />
            <path d="M 43 66 Q 50 78 57 66 Z" fill="#ff708e" />
          </g>
        );
      case 2: // Big toothy grin
        return (
          <g>
            <path d="M 36 58 Q 50 76 64 58 Z" fill="#ffffff" stroke="#1a1a1a" strokeWidth="3" />
            <line x1="43" y1="58" x2="43" y2="67" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="50" y1="58" x2="50" y2="70" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="57" y1="58" x2="57" y2="67" stroke="#1a1a1a" strokeWidth="2" />
          </g>
        );
      case 3: // Tongue out :P
        return (
          <g>
            <path d="M 38 60 Q 50 64 62 60" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 50 62 C 50 74 60 74 60 62 Z" fill="#ff5277" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="55" y1="62" x2="55" y2="69" stroke="#b31d3d" strokeWidth="1.5" />
          </g>
        );
      case 4: // Straight line / Neutral
        return (
          <line x1="40" y1="63" x2="60" y2="63" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" />
        );
      case 5: // Cat mouth :3
        return (
          <path d="M 40 60 Q 45 66 50 60 Q 55 66 60 60" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" fill="none" />
        );
      case 6: // Surprised O mouth
        return (
          <circle cx="50" cy="64" r="6" fill="#7a1414" stroke="#1a1a1a" strokeWidth="2.5" />
        );
      case 7: // Sad / Frown
        return (
          <path d="M 40 67 Q 50 56 60 67" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        );
      case 8: // Smirk
        return (
          <path d="M 42 63 Q 54 62 62 57" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        );
      case 9: // Cheeky mustache
        return (
          <g fill="#332211">
            <path d="M 50 60 Q 42 56 36 61 Q 44 65 50 60" />
            <path d="M 50 60 Q 58 56 64 61 Q 56 65 50 60" />
          </g>
        );
      case 0:
      default: // Classic Smile
        return (
          <path d="M 38 58 Q 50 72 62 58" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
      >
        {/* Cute Blob Body */}
        <defs>
          <linearGradient id={`blobGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Shadow base */}
        <ellipse cx="50" cy="85" rx="34" ry="7" fill="#000000" opacity="0.15" />

        {/* Head/Body Shape with outline */}
        <rect
          x="16"
          y="18"
          width="68"
          height="64"
          rx="28"
          fill={`url(#blobGrad-${color})`}
          stroke="#1a1a1a"
          strokeWidth="4"
        />

        {/* Head Highlight / Specular */}
        <path
          d="M 28 26 Q 50 20 72 26"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.45"
          fill="none"
        />

        {/* Cute rosy cheeks */}
        <ellipse cx="26" cy="54" rx="4.5" ry="3" fill="#ff4d79" opacity="0.35" />
        <ellipse cx="74" cy="54" rx="4.5" ry="3" fill="#ff4d79" opacity="0.35" />

        {/* Eyes & Mouth */}
        {renderEyes()}
        {renderMouth()}

        {/* Host Crown */}
        {isHost && (
          <g transform="translate(6, -2) rotate(-14 20 20)">
            <polygon
              points="10,24 16,8 24,18 32,8 38,24"
              fill="#ffd700"
              stroke="#b39700"
              strokeWidth="2"
            />
            <rect x="10" y="22" width="28" height="5" rx="1.5" fill="#f0c300" stroke="#b39700" strokeWidth="1" />
            <circle cx="16" cy="11" r="2" fill="#ef130b" />
            <circle cx="24" cy="19" r="2.2" fill="#00b2ff" />
            <circle cx="32" cy="11" r="2" fill="#ef130b" />
          </g>
        )}
      </svg>

      {/* Animated Drawing Pen Icon */}
      {isDrawing && (
        <div className="absolute -top-2 -right-2 w-6 h-6 animate-bounce pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              fill="#ffe400"
              stroke="#1a1a1a"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
