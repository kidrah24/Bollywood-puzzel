import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Home, RotateCcw, Star } from 'lucide-react';
import { DIFFICULTIES } from '../data/movies';
import { buildShareText, formatTime } from '../utils/puzzle';
import type { BollywoodFilm, RoundResult } from '../types/game';

interface RoundSummaryModalProps {
  film: BollywoodFilm;
  result: RoundResult;
  hasNextReel: boolean;
  onNextReel: () => void;
  onReplay: () => void;
  onReturnTitle: () => void;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({
  film,
  result,
  hasNextReel,
  onNextReel,
  onReplay,
  onReturnTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const diff = DIFFICULTIES[result.difficulty];
  const effectiveTime = result.timeSeconds + result.penaltySeconds;

  const handleCopyShare = async () => {
    const shareText = buildShareText(result, diff);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareText;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/88 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-[18px] bg-[#1B1B1B] border-2 border-[#2D2D2D] p-5 sm:p-7 shadow-[0_32px_80px_rgba(0,0,0,0.82)] my-auto">
        <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-6 items-start">
          {/* Restored Poster Frame */}
          <div
            className={`mx-auto sm:mx-0 rounded-[12px] overflow-hidden border-2 border-[#F96922]/60 shadow-xl bg-[#111111] shrink-0 ${
              film.aspectRatio === 'square'
                ? 'w-[180px] sm:w-[190px] aspect-square'
                : 'w-[160px] sm:w-[190px] aspect-[3/4]'
            }`}
          >
            <img
              src={film.posterUrl}
              alt={`Restored poster for ${film.title}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Column: Film Identity + Score Breakdown */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <span
                className={`text-xs font-bold ${
                  result.identified ? 'text-[#159BE0]' : 'text-[#F96922]'
                }`}
              >
                {result.identified
                  ? 'Box Office Hit · Film Identified'
                  : 'Poster Restored · Film Revealed'}
              </span>

              {/* Stars */}
              <div
                className="flex items-center gap-1"
                aria-label={`${result.stars} out of 3 stars`}
              >
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= result.stars
                        ? 'text-[#F96922] fill-[#F96922]'
                        : 'text-[#2D2D2D]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h2
              id="summary-modal-title"
              className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#F0F0F0] tracking-tight leading-tight text-balance"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {film.title}
            </h2>

            <p className="mt-1.5 text-xs text-[#9F9FAA]">
              {film.year} · {film.genre} · Dir. {film.director}
            </p>
            <p className="mt-1 text-xs text-[#D8D8DF]">
              Starring {film.cast.join(', ')}
            </p>

            {/* Tabular Score Breakdown */}
            <div className="mt-5 grid grid-cols-4 gap-3 py-3.5 border-y border-[#2D2D2D]">
              <div>
                <div className="text-[11px] text-[#71717D]">Score</div>
                <div className="mt-0.5 font-mono text-lg font-bold text-[#F96922] tabular-nums">
                  {result.score}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#71717D]">Cut Time</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[#F0F0F0] tabular-nums">
                  {formatTime(effectiveTime)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#71717D]">Swaps</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[#F0F0F0] tabular-nums">
                  {result.moves}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#71717D]">Guesses</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[#F0F0F0] tabular-nums">
                  {result.identified ? `${result.guesses.length}/3` : '—'}
                </div>
              </div>
            </div>

            {/* Cinema Trivia Note */}
            <p className="mt-4 text-xs leading-relaxed text-[#9F9FAA]">
              {film.trivia}
            </p>

            {/* Primary & Secondary Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onNextReel}
                className="flex-1 min-w-[140px] h-11 px-5 rounded-[11px] bg-[#F96922] text-white text-sm font-bold hover:bg-[#FF7A38] shadow-[0_3px_0_#793715] active:translate-y-[1px] active:shadow-[0_1px_0_#793715] inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
              >
                <span>
                  {result.mode === 'daily'
                    ? 'Play Studio Reel'
                    : hasNextReel
                    ? 'Next Poster'
                    : 'Play Again'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCopyShare}
                className="h-11 px-4 rounded-[11px] border border-[#2D2D2D] bg-[#242428] text-xs font-semibold text-[#F0F0F0] hover:border-[#159BE0] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#159BE0]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#159BE0]" />
                    <span>Share Result</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReplay}
                title="Replay this poster"
                aria-label="Replay this poster"
                className="h-11 w-11 rounded-[11px] border border-[#2D2D2D] bg-[#242428] text-[#9F9FAA] hover:text-[#F0F0F0] inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onReturnTitle}
                title="Return to Title Screen"
                aria-label="Return to Title Screen"
                className="h-11 w-11 rounded-[11px] border border-[#2D2D2D] bg-[#242428] text-[#9F9FAA] hover:text-[#F0F0F0] inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
