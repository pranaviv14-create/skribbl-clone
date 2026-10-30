import React, { useEffect } from 'react';
import { PALETTE_COLORS, BRUSH_SIZES } from '../constants';
import { sounds } from '../sounds';
import { Paintbrush, PaintBucket, Eraser, Undo2, Trash2 } from 'lucide-react';

export type ToolType = 'brush' | 'fill' | 'eraser';

interface DrawingToolbarProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  brushSize: number;
  onSelectBrushSize: (size: number) => void;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onClear: () => void;
  canDraw: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentColor,
  onSelectColor,
  brushSize,
  onSelectBrushSize,
  activeTool,
  onSelectTool,
  onUndo,
  onClear,
  canDraw
}) => {
  // Global Hotkey listeners for B, F, E, U, C, Ctrl+Z
  useEffect(() => {
    if (!canDraw) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in chat input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        onUndo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          onSelectTool('brush');
          sounds.playPop();
          break;
        case 'f':
          onSelectTool('fill');
          sounds.playPop();
          break;
        case 'e':
          onSelectTool('eraser');
          sounds.playPop();
          break;
        case 'u':
          onUndo();
          break;
        case 'c':
          onClear();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canDraw, onSelectTool, onUndo, onClear]);

  if (!canDraw) {
    return (
      <div className="h-[74px] w-full bg-white/40 rounded-[3px] flex items-center justify-center text-gray-500 font-extrabold text-sm select-none border border-gray-300">
        You are guessing! Watch the canvas carefully.
      </div>
    );
  }

  return (
    <div className="h-[74px] w-full bg-white rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-between px-3 select-none border border-gray-300 gap-2">
      {/* 1. Selected Color Preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-[46px] h-[46px] rounded-[3px] border-2 border-black/30 shadow-inner flex items-center justify-center transition-colors"
          style={{ backgroundColor: activeTool === 'eraser' ? '#ffffff' : currentColor }}
          title={activeTool === 'eraser' ? 'Eraser Active' : `Current Color: ${currentColor}`}
        >
          {activeTool === 'eraser' && <Eraser size={20} className="text-gray-500" />}
        </div>
      </div>

      {/* 2. Skribbl 26-Color 2-Row Palette */}
      <div className="flex flex-col gap-[3px]">
        {/* Top Row (13 colors) */}
        <div className="flex gap-[3px]">
          {PALETTE_COLORS.top.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                sounds.playPop();
                if (activeTool === 'eraser') onSelectTool('brush');
                onSelectColor(c);
              }}
              style={{ backgroundColor: c }}
              className={`w-[22px] h-[22px] rounded-[2px] transition-transform hover:scale-110 active:scale-90 border ${
                currentColor.toLowerCase() === c.toLowerCase() && activeTool !== 'eraser'
                  ? 'border-black ring-2 ring-blue-500 scale-105 z-10'
                  : 'border-black/20'
              }`}
            />
          ))}
        </div>

        {/* Bottom Row (13 colors) */}
        <div className="flex gap-[3px]">
          {PALETTE_COLORS.bottom.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                sounds.playPop();
                if (activeTool === 'eraser') onSelectTool('brush');
                onSelectColor(c);
              }}
              style={{ backgroundColor: c }}
              className={`w-[22px] h-[22px] rounded-[2px] transition-transform hover:scale-110 active:scale-90 border ${
                currentColor.toLowerCase() === c.toLowerCase() && activeTool !== 'eraser'
                  ? 'border-white ring-2 ring-blue-500 scale-105 z-10'
                  : 'border-black/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3. Brush Size Selectors */}
      <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-[3px] border border-gray-300">
        {BRUSH_SIZES.map((sz) => {
          const isSelected = brushSize === sz && activeTool !== 'fill';
          return (
            <button
              key={sz}
              type="button"
              onClick={() => {
                sounds.playPop();
                onSelectBrushSize(sz);
              }}
              title={`Size: ${sz}px`}
              className={`w-[32px] h-[32px] rounded-[3px] flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-[#ab66eb] text-white shadow-inner scale-105'
                  : 'bg-white hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div
                className="rounded-full bg-current transition-all"
                style={{
                  width: Math.max(4, Math.min(22, sz * 0.55)),
                  height: Math.max(4, Math.min(22, sz * 0.55))
                }}
              />
            </button>
          );
        })}
      </div>

      {/* 4. Tool Selectors (Brush, Fill Bucket, Eraser) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onSelectTool('brush');
          }}
          title="Brush (Hotkey: B)"
          className={`p-2 rounded-[3px] transition-all ${
            activeTool === 'brush'
              ? 'bg-[#53e237] text-white shadow-[0_2px_0_#2b8214]'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Paintbrush size={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onSelectTool('fill');
          }}
          title="Bucket Fill (Hotkey: F)"
          className={`p-2 rounded-[3px] transition-all ${
            activeTool === 'fill'
              ? 'bg-[#53e237] text-white shadow-[0_2px_0_#2b8214]'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <PaintBucket size={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onSelectTool('eraser');
          }}
          title="Eraser (Hotkey: E)"
          className={`p-2 rounded-[3px] transition-all ${
            activeTool === 'eraser'
              ? 'bg-[#53e237] text-white shadow-[0_2px_0_#2b8214]'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Eraser size={20} />
        </button>
      </div>

      {/* 5. Canvas Actions (Undo & Clear) */}
      <div className="flex items-center gap-1 border-l pl-2 border-gray-300">
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onUndo();
          }}
          title="Undo Stroke (Hotkey: U / Ctrl+Z)"
          className="p-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-[3px] text-gray-700 transition-all"
        >
          <Undo2 size={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            if (confirm('Clear the entire canvas?')) {
              onClear();
            }
          }}
          title="Clear Canvas (Hotkey: C)"
          className="p-2 bg-gray-100 hover:bg-red-50 active:bg-red-100 rounded-[3px] text-red-600 transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};
