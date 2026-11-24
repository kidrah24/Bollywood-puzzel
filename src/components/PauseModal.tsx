import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';
import { DIFFICULTY_LIST } from '../data/movies';
import type { DifficultyKey } from '../types/game';

interface PauseModalProps {
  difficulty: DifficultyKey;
  onResume: () => void;
  onRestart: () => void;
  onChangeDifficulty: (diff: DifficultyKey) => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  difficulty,
  onResume,
  onRestart,
  onChangeDifficulty,
  onReturnTitle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/86"
    >
      <div className="w-full max-w-sm rounded-[18px] bg-[#1B1B1B] border-2 border-[#2D2D2D] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.78)]">
        <h2
          id="pause-modal-title"
          className="text-2xl font-extrabold text-[#F0F0F0] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Intermission
        </h2>
        <p className="mt-1 text-xs text-[#9F9FAA]">
          Stopwatch paused. Resume right where you left off.
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full h-11 px-4 rounded-[11px] bg-[#F96922] text-white text-sm font-bold hover:bg-[#FF7A38] shadow-[0_3px_0_#793715] active:translate-y-[1px] active:shadow-[0_1px_0_#793715] inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Cut</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full h-11 px-4 rounded-[11px] border border-[#2D2D2D] bg-[#242428] text-sm font-semibold text-[#F0F0F0] hover:border-[#42424A] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reshuffle Poster</span>
          </button>
        </div>

        {/* Quick difficulty switcher */}
        <div className="mt-5 pt-4 border-t border-[#2D2D2D]">
          <p className="text-xs text-[#9F9FAA] mb-2">Cut density (restarts poster)</p>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[11px] bg-[#111111] border border-[#2D2D2D]">
            {DIFFICULTY_LIST.map((d) => {
              const active = d.key === difficulty;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => onChangeDifficulty(d.key)}
                  className={`py-2 px-2 rounded-[8px] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#F96922] text-white'
                      : 'text-[#9F9FAA] hover:text-[#F0F0F0]'
                  }`}
                >
                  {d.cols}×{d.rows}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnTitle}
          className="mt-4 w-full h-10 px-4 rounded-[10px] text-xs font-medium text-[#9F9FAA] hover:text-[#F0F0F0] hover:bg-[#F0F0F0]/6 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Title Screen</span>
        </button>
      </div>
    </div>
  );
};
