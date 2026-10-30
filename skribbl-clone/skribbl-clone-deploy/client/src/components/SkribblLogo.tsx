import React from 'react';

export const SkribblLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'lg' }) => {
  const scale = size === 'sm' ? 0.6 : size === 'md' ? 0.8 : 1.1;

  return (
    <div
      className="inline-flex items-center justify-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      <svg
        viewBox="0 0 320 80"
        className="w-[320px] h-[80px] drop-shadow-[3px_3px_0_rgba(0,0,0,0.25)] overflow-visible"
      >
        <defs>
          <filter id="skribbl-shadow">
            <feDropShadow dx="3" dy="4" stdDeviation="0" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Letters with distinct Skribbl cartoon colors */}
        <g
          filter="url(#skribbl-shadow)"
          fontFamily="'Nunito', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="56"
          stroke="#000000"
          strokeWidth="6"
          paintOrder="stroke fill"
          strokeLinejoin="round"
        >
          {/* s */}
          <text x="10" y="60" fill="#ef130b" transform="rotate(-4 25 50)">s</text>
          {/* k */}
          <text x="42" y="58" fill="#ff7100" transform="rotate(3 55 50)">k</text>
          {/* r */}
          <text x="80" y="61" fill="#ffe400" transform="rotate(-3 90 50)">r</text>
          {/* i */}
          <text x="110" y="58" fill="#00cc00" transform="rotate(2 115 50)">i</text>
          {/* b */}
          <text x="132" y="60" fill="#00b2ff" transform="rotate(-2 145 50)">b</text>
          {/* b */}
          <text x="172" y="58" fill="#231fd3" transform="rotate(3 185 50)">b</text>
          {/* l */}
          <text x="212" y="59" fill="#a300ba" transform="rotate(-3 220 50)">l</text>
          {/* . */}
          <text x="235" y="60" fill="#df69a7">.</text>
          {/* i */}
          <text x="252" y="58" fill="#ffac8e" transform="rotate(2 258 50)">i</text>
          {/* o */}
          <text x="272" y="60" fill="#ffe400" transform="rotate(-4 285 50)">o</text>
        </g>
      </svg>
    </div>
  );
};
