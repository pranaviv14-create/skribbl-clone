import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isDrawing: boolean;
  hasGuessed: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isDrawing,
  hasGuessed
}) => {
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isDrawing) return;

    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <div className="w-[280px] md:w-[310px] flex flex-col bg-white rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.25)] select-none border border-gray-300 overflow-hidden">
      {/* Scrollable Message List */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 min-h-[360px] max-h-[520px] text-xs md:text-sm font-semibold"
      >
        {messages.map((msg, idx) => {
          const isOdd = idx % 2 === 1;
          const rowBg = isOdd ? 'bg-[#ececec]/60' : 'bg-transparent';

          if (msg.type === 'system') {
            let textColor = 'text-gray-700 font-bold';
            if (msg.subType === 'correct_guess' || msg.subType === 'join') {
              textColor = 'text-[#56CE27] font-black';
            } else if (msg.subType === 'close_guess') {
              textColor = 'text-[#cfa400] font-black';
            } else if (msg.subType === 'turn_start') {
              textColor = 'text-[#3975CE] font-black';
            } else if (msg.subType === 'leave') {
              textColor = 'text-[#CE4F0A] font-bold';
            }

            return (
              <div
                key={idx}
                className={`py-1 px-2 rounded-[2px] ${textColor} ${rowBg} leading-snug`}
              >
                {msg.text}
              </div>
            );
          }

          // User chat or secret guessed chat
          const isGuessedChat = msg.isGuessedChat;
          const userColor = isGuessedChat ? 'text-[#7dad3f]' : 'text-gray-900';

          return (
            <div
              key={idx}
              className={`py-0.5 px-2 rounded-[2px] ${rowBg} leading-snug break-words`}
            >
              <span className="font-extrabold text-gray-800 mr-1.5">
                {msg.senderName}:
              </span>
              <span className={`font-semibold ${userColor}`}>
                {msg.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-2 bg-gray-50 border-t border-gray-200">
        <div className="relative flex items-center">
          <input
            type="text"
            disabled={isDrawing}
            maxLength={100}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isDrawing
                ? 'You are drawing! No spoiling.'
                : hasGuessed
                ? 'Type in chat with other guessers...'
                : 'Type your guess here...'
            }
            className={`w-full h-[40px] px-3 pr-10 text-xs md:text-sm font-bold rounded-[3px] border-2 outline-none transition-colors ${
              isDrawing
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-900 border-gray-300 focus:border-[#56b2fd]'
            }`}
          />
          {/* Character counter */}
          {!isDrawing && inputText.length > 0 && (
            <span className="absolute right-2 text-[10px] font-bold text-gray-400 select-none">
              {100 - inputText.length}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
