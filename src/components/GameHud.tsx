import React from 'react';
import { ArrowLeft, Eye, Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { formatTime } from '../utils/puzzle';
import type { DifficultyConfig, GameMode, GameState } from '../types/game';

interface GameHudProps {
  gameState: GameState;
  mode: GameMode;
  dailyCutNumber: number;
  reelIndex: number;
  totalReels: number;
  difficulty: DifficultyConfig;
  timeSeconds: number;
  penaltySeconds: number;
  moves: number;
  lockedCount: number;
  totalTiles: number;
  isPeeking: boolean;
  muted: boolean;
  onBack: () => void;
  onPeek: () => void;
  onAutoSplice: () => void;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  gameState,
  mode,
  dailyCutNumber,
  reelIndex,
  totalReels,
  difficulty,
  timeSeconds,
  penaltySeconds,
  moves,
  lockedCount,
  totalTiles,
  isPeeking,
  muted,
  onBack,
  onPeek,
  onAutoSplice,
  onToggleMute,
  onPause,
}) => {
  const isPlaying = gameState === 'PLAYING';
  const progressPct = totalTiles > 0 ? Math.round((lockedCount / totalTiles) * 100) : 0;

  return (
    <header className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4 border-b border-[#2D2D2D] bg-[#111111]/95 shrink-0 z-20">
      {/* Zone 1: Back + Brand + Context */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to home"
          title="Back to Home"
          className="h-9 px-2.5 sm:px-3 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-xs font-semibold text-[#F0F0F0] hover:border-[#F96922] hover:text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#F96922]" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          aria-label="Return to Bollywood Cut home"
          className="hidden sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F96922] rounded-md cursor-pointer"
        >
          <BrandLogo variant="compact" />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-[#9F9FAA] whitespace-nowrap">
          <span aria-hidden="true" className="text-[#71717D]">/</span>
          <span className="text-[#F0F0F0] font-semibold">
            {mode === 'daily'
              ? `Daily Feature #${dailyCutNumber}`
              : `Reel ${reelIndex + 1} of ${totalReels}`}
          </span>
          <span aria-hidden="true" className="text-[#71717D]">·</span>
          <span>
            {difficulty.label} ({difficulty.cols}×{difficulty.rows})
          </span>
        </div>
      </div>

      {/* Zone 2: Live Tabular Telemetry */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-[#71717D] hidden sm:inline">Time</span>
          <span className="font-mono text-sm sm:text-base font-semibold text-[#F0F0F0] tabular-nums">
            {formatTime(timeSeconds + penaltySeconds)}
          </span>
          {penaltySeconds > 0 && (
            <span className="font-mono text-[11px] text-[#F96922] tabular-nums">
              (+{penaltySeconds}s)
            </span>
          )}
        </div>

        <span aria-hidden="true" className="text-[#2D2D2D] hidden sm:inline">
          ·
        </span>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-[#71717D] hidden sm:inline">Swaps</span>
          <span className="font-mono text-sm sm:text-base font-semibold text-[#F0F0F0] tabular-nums">
            {moves}
          </span>
          <span className="font-mono text-xs text-[#71717D] tabular-nums">
            /{difficulty.parMoves}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2.5 pl-1">
          <div className="w-24 h-2 rounded-full bg-[#242428] overflow-hidden">
            <div
              className="h-full bg-[#F96922] transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${progressPct / 100})` }}
            />
          </div>
          <span className="font-mono text-xs text-[#9F9FAA] tabular-nums whitespace-nowrap">
            {lockedCount}/{totalTiles}
          </span>
        </div>
      </div>

      {/* Zone 3: Functional Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isPlaying && (
          <>
            <button
              type="button"
              onClick={onPeek}
              disabled={isPeeking}
              title="Peek full poster for 1.5s (+5s penalty)"
              className="h-9 px-2.5 sm:px-3 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-xs font-semibold text-[#F0F0F0] hover:border-[#159BE0] disabled:opacity-45 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#159BE0]" />
              <span className="hidden sm:inline">Peek</span>
            </button>

            <button
              type="button"
              onClick={onAutoSplice}
              title="Lock one piece into its correct position (+10s penalty)"
              className="h-9 px-2.5 sm:px-3 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-xs font-semibold text-[#F0F0F0] hover:border-[#F96922] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F96922]" />
              <span className="hidden sm:inline">Splice 1</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          title={muted ? 'Unmute sound (M)' : 'Mute sound (M)'}
          className="h-9 w-9 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-[#9F9FAA] hover:text-[#F0F0F0] hover:border-[#42424A] inline-flex items-center justify-center transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="Pause game"
          title="Pause (Esc)"
          className="h-9 w-9 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-[#9F9FAA] hover:text-[#F0F0F0] hover:border-[#42424A] inline-flex items-center justify-center transition-colors cursor-pointer"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
