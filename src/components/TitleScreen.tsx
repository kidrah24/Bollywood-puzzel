import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  Play,
  Shuffle,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { DIFFICULTY_LIST, FEATURED_MOVIES } from '../data/movies';
import { formatTime } from '../utils/puzzle';
import type { BollywoodFilm, DifficultyKey, PlayerStats } from '../types/game';

interface TitleScreenProps {
  difficulty: DifficultyKey;
  dailyFilm: BollywoodFilm;
  dailyCutNumber: number;
  dailySolvedToday: boolean;
  stats: PlayerStats;
  muted: boolean;
  onSelectDifficulty: (diff: DifficultyKey) => void;
  onPlayDaily: () => void;
  onPlayReel: (index: number) => void;
  onPlayRandom: () => void;
  onToggleMute: () => void;
}

type ArchiveFilter = 'all' | 'unsolved' | 'solved';

const PREVIEW_STATES: number[][] = [
  [4, 1, 7, 3, 0, 8, 6, 2, 5],
  [4, 1, 7, 3, 2, 8, 6, 0, 5],
  [0, 1, 7, 3, 2, 8, 6, 4, 5],
  [0, 1, 2, 3, 7, 8, 6, 4, 5],
];

const MYSTERY_QUAD_ORDER = [3, 0, 2, 1];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  difficulty,
  dailyFilm,
  dailyCutNumber,
  dailySolvedToday,
  stats,
  muted,
  onSelectDifficulty,
  onPlayDaily,
  onPlayReel,
  onPlayRandom,
  onToggleMute,
}) => {
  const [filter, setFilter] = useState<ArchiveFilter>('all');
  const [helpOpen, setHelpOpen] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);

  // Subtle animated 3x3 scrambled preview inside the Daily Cut hero card
  useEffect(() => {
    const id = window.setInterval(() => {
      setPreviewStep((prev) => (prev + 1) % PREVIEW_STATES.length);
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  // Keyboard shortcuts on hub (Enter = Play Daily, R = Random, Esc = close Help)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['BUTTON', 'INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }
      if (e.key === 'Escape' && helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (helpOpen) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPlayDaily();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onPlayRandom();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [helpOpen, onPlayDaily, onPlayRandom]);

  const solvedCount = useMemo(
    () =>
      FEATURED_MOVIES.filter((m) => Boolean(stats.records[m.id]?.identified)).length,
    [stats.records]
  );

  const filteredMovies = useMemo(() => {
    return FEATURED_MOVIES.map((movie, index) => ({ movie, index })).filter(({ movie }) => {
      const solved = Boolean(stats.records[movie.id]?.identified);
      if (filter === 'solved') return solved;
      if (filter === 'unsolved') return !solved;
      return true;
    });
  }, [filter, stats.records]);

  const previewOrder = PREVIEW_STATES[previewStep];

  return (
    <div className="min-h-screen w-full bg-[#111111] text-[#F0F0F0] flex flex-col">
      {/* Crisp Matte Arcade Top Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-[#2D2D2D] bg-[#111111]/95">
        <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo variant="compact" />

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2.5 text-xs text-[#9F9FAA] tabular-nums">
              <span>Streak {stats.dailyStreak}</span>
              <span aria-hidden="true" className="text-[#2D2D2D]">·</span>
              <span>
                Solved {solvedCount}/{FEATURED_MOVIES.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="How to play"
              title="How to play"
              className="h-9 px-3 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-xs font-semibold text-[#D8D8DF] hover:text-[#F0F0F0] hover:border-[#42424A] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#159BE0]" />
              <span className="hidden sm:inline">How to Play</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              title={muted ? 'Unmute (M)' : 'Mute (M)'}
              className="h-9 w-9 rounded-[10px] border border-[#2D2D2D] bg-[#1B1B1B] text-[#9F9FAA] hover:text-[#F0F0F0] hover:border-[#42424A] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#F96922]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Arcade Hub */}
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Featured Daily Cut Arcade Card */}
        <section className="rounded-[20px] bg-[#1B1B1B] border-2 border-[#2D2D2D] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] lg:grid-cols-[230px_1fr] gap-6 sm:gap-8 items-center">
            {/* Live Animated Scrambled 3x3 Poster Preview */}
            <button
              type="button"
              onClick={onPlayDaily}
              aria-label="Play Daily Feature poster puzzle"
              className="group relative mx-auto md:mx-0 w-[190px] sm:w-[210px] lg:w-[230px] aspect-square rounded-[14px] overflow-hidden bg-[#111111] border-2 border-[#2D2D2D] hover:border-[#F96922] transition-colors p-1.5 cursor-pointer shrink-0"
            >
              <div
                className="w-full h-full rounded-[9px] overflow-hidden grid grid-cols-3 grid-rows-3 gap-[2px] bg-[#111111]"
              >
                {previewOrder.map((pieceId, idx) => {
                  const col = pieceId % 3;
                  const row = Math.floor(pieceId / 3);
                  const isHome = pieceId === idx;
                  return (
                    <div
                      key={idx}
                      className={`relative w-full h-full transition-transform duration-300 ${
                        isHome ? 'ring-1 ring-inset ring-[#F96922]/70' : ''
                      }`}
                      style={{
                        backgroundImage: `url("${dailyFilm.posterUrl}")`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: `${(col / 2) * 100}% ${(row / 2) * 100}%`,
                        filter: dailySolvedToday ? 'none' : 'blur(1.2px) contrast(1.05)',
                      }}
                    />
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#111111]/25 group-hover:bg-[#111111]/10 transition-colors">
                <span className="h-11 w-11 rounded-full bg-[#F96922] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                </span>
              </div>
            </button>

            {/* Right: Crisp Controls & Instant Launch CTAs */}
            <div className="flex flex-col justify-between text-center md:text-left">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-[#9F9FAA] tabular-nums">
                  <span className="text-[#F96922]">Daily Feature #{dailyCutNumber}</span>
                  <span aria-hidden="true" className="text-[#2D2D2D]">·</span>
                  <span>{dailyFilm.eraLabel}</span>
                  {dailySolvedToday && (
                    <>
                      <span aria-hidden="true" className="text-[#2D2D2D]">·</span>
                      <span className="text-[#159BE0] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Solved
                      </span>
                    </>
                  )}
                </div>

                <h1
                  className="mt-2 text-2xl sm:text-4xl font-black text-[#F0F0F0] tracking-tight leading-tight text-balance"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Unscramble the Poster. Name the Film.
                </h1>

                <p className="mt-2 text-sm text-[#9F9FAA] max-w-xl mx-auto md:mx-0">
                  Swap rectangular cuts until every piece snap-locks into place, then guess the Bollywood classic in three tries.
                </p>
              </div>

              {/* Compact Difficulty Selector + Primary / Random CTAs */}
              <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="block text-[11px] font-semibold text-[#71717D] mb-1.5 text-center md:text-left">
                    Grid Size
                  </span>
                  <div className="inline-flex p-1 rounded-[12px] bg-[#111111] border border-[#2D2D2D]">
                    {DIFFICULTY_LIST.map((d) => {
                      const active = d.key === difficulty;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => onSelectDifficulty(d.key)}
                          className={`px-3.5 py-2 rounded-[9px] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-[#F0F0F0] text-[#111111]'
                              : 'text-[#9F9FAA] hover:text-[#F0F0F0]'
                          }`}
                        >
                          {d.label} {d.cols}×{d.rows}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 lg:pt-5">
                  <button
                    type="button"
                    onClick={onPlayDaily}
                    className="h-12 px-6 rounded-[13px] bg-[#F96922] text-white text-sm font-bold hover:bg-[#FF7A38] shadow-[0_4px_0_#793715] active:translate-y-[2px] active:shadow-[0_2px_0_#793715] inline-flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{dailySolvedToday ? 'Replay Daily Cut' : 'Play Daily Cut'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onPlayRandom}
                    className="h-12 px-5 rounded-[13px] bg-[#242428] border border-[#34343B] text-[#F0F0F0] text-sm font-bold hover:border-[#159BE0] hover:text-white inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4 text-[#159BE0]" />
                    <span>Random Poster</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Studio Archive — Visual Grid of All 37 Real Bollywood Posters */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-baseline gap-3">
              <h2
                className="text-xl font-extrabold text-[#F0F0F0] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Studio Archive
              </h2>
              <span className="text-xs text-[#9F9FAA] tabular-nums">
                {solvedCount} of {FEATURED_MOVIES.length} identified · Click any poster to play
              </span>
            </div>

            {/* Functional Filter Tabs */}
            <div className="inline-flex p-1 rounded-[11px] bg-[#1B1B1B] border border-[#2D2D2D] self-start sm:self-auto">
              {(
                [
                  { key: 'all', label: `All (${FEATURED_MOVIES.length})` },
                  { key: 'unsolved', label: `Unsolved (${FEATURED_MOVIES.length - solvedCount})` },
                  { key: 'solved', label: `Solved (${solvedCount})` },
                ] as { key: ArchiveFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    filter === tab.key
                      ? 'bg-[#F96922] text-white'
                      : 'text-[#9F9FAA] hover:text-[#F0F0F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredMovies.length === 0 ? (
            <div className="rounded-[16px] bg-[#1B1B1B] border border-[#2D2D2D] py-12 px-6 text-center">
              <p className="text-sm font-medium text-[#D8D8DF]">
                {filter === 'solved'
                  ? 'No posters identified yet — jump into any mystery cut to start your collection.'
                  : 'You have identified every single Bollywood poster in the archive!'}
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="mt-4 h-10 px-5 rounded-[10px] bg-[#F96922] text-white text-xs font-bold hover:bg-[#FF7A38] transition-colors cursor-pointer"
              >
                Show All Posters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filteredMovies.map(({ movie, index }) => {
                const rec = stats.records[movie.id];
                const solved = Boolean(rec?.identified);

                return (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => onPlayReel(index)}
                    className="group rounded-[14px] bg-[#1B1B1B] border-2 border-[#2D2D2D] hover:border-[#F96922] p-2 text-left flex flex-col transition-all hover:-translate-y-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F96922]"
                  >
                    {/* Poster Visual Thumbnail (Restored if solved, Scrambled 2x2 Mosaic if mystery) */}
                    <div className="relative w-full aspect-square rounded-[9px] overflow-hidden bg-[#111111]">
                      {solved ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px] bg-[#111111]">
                          {MYSTERY_QUAD_ORDER.map((quad, qIdx) => {
                            const qCol = quad % 2;
                            const qRow = Math.floor(quad / 2);
                            return (
                              <div
                                key={qIdx}
                                className="w-full h-full"
                                style={{
                                  backgroundImage: `url("${movie.posterUrl}")`,
                                  backgroundSize: '200% 200%',
                                  backgroundPosition: `${qCol * 100}% ${qRow * 100}%`,
                                  filter: 'blur(3.5px) brightness(0.72) saturate(0.85)',
                                }}
                              />
                            );
                          })}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-sm font-bold text-[#F0F0F0]/90 bg-[#111111]/75 px-2.5 py-1 rounded-[7px] border border-[#2D2D2D] group-hover:border-[#F96922] group-hover:text-[#F96922] transition-colors">
                              #{String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clean Card Metadata */}
                    <div className="mt-2.5 px-0.5 flex-1 flex flex-col justify-between">
                      <div className="text-xs font-bold text-[#F0F0F0] truncate">
                        {solved ? movie.title : movie.eraLabel}
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] text-[#71717D] tabular-nums">
                          {rec ? formatTime(rec.bestTime) : `Reel ${String(index + 1).padStart(2, '0')}`}
                        </span>

                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3].map((n) => (
                            <Star
                              key={n}
                              className={`w-3 h-3 ${
                                rec && n <= rec.stars
                                  ? 'text-[#F96922] fill-[#F96922]'
                                  : 'text-[#2D2D2D]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Quiet Single-Line Footer Hint */}
      <footer className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 pb-6 pt-2 text-xs text-[#71717D] flex items-center justify-between">
        <span>Enter Play Daily · R Random Poster · Drag or Click to Swap · M Mute</span>
      </footer>

      {/* How to Play Modal */}
      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/85"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[18px] bg-[#1B1B1B] border-2 border-[#2D2D2D] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-[#2D2D2D]">
              <h2
                id="help-modal-title"
                className="text-xl font-extrabold text-[#F0F0F0]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                How to Play
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close instructions"
                className="h-8 w-8 rounded-[8px] bg-[#242428] text-[#9F9FAA] hover:text-[#F0F0F0] inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="mt-4 space-y-3.5 text-sm text-[#D8D8DF]">
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#F96922] pt-0.5">01.</span>
                <span>
                  Drag any piece onto another — or click two pieces — to swap their positions on the poster board.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#159BE0] pt-0.5">02.</span>
                <span>
                  Pieces landing in their exact home slot snap-lock automatically and seamlessly fuse with neighboring locked pieces.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#B748FE] pt-0.5">03.</span>
                <span>
                  Once the poster is fully reconstructed, identify the Bollywood film within 3 tries to earn up to 3 stars and 1,000 points.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-6 w-full h-11 rounded-[11px] bg-[#F96922] text-white text-sm font-bold hover:bg-[#FF7A38] shadow-[0_3px_0_#793715] transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
