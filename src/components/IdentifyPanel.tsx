import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Lightbulb, Search, X } from 'lucide-react';
import { BOLLYWOOD_CATALOG, normalizeTitle } from '../data/movies';
import type { BollywoodFilm } from '../types/game';

interface IdentifyPanelProps {
  film: BollywoodFilm;
  guesses: string[];
  maxGuesses: number;
  dialogueClueUsed: boolean;
  shakeKey: number;
  onSubmitGuess: (guess: string) => void;
  onUnlockDialogueClue: () => void;
  onGiveUp: () => void;
}

export const IdentifyPanel: React.FC<IdentifyPanelProps> = ({
  film,
  guesses,
  maxGuesses,
  dialogueClueUsed,
  shakeKey,
  onSubmitGuess,
  onUnlockDialogueClue,
  onGiveUp,
}) => {
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [film.id]);

  const remaining = Math.max(0, maxGuesses - guesses.length);
  const wrongCount = guesses.length;

  const suggestions = useMemo(() => {
    const clean = normalizeTitle(query);
    if (!clean) return [];
    const triedSet = new Set(guesses.map((g) => normalizeTitle(g)));

    return BOLLYWOOD_CATALOG.filter((entry) => {
      if (triedSet.has(normalizeTitle(entry.title))) return false;
      const inTitle = normalizeTitle(entry.title).includes(clean);
      const inAlias = entry.aliases?.some((a) => normalizeTitle(a).includes(clean));
      return inTitle || inAlias;
    })
      .sort((a, b) => {
        const aStarts = normalizeTitle(a.title).startsWith(clean) ? 0 : 1;
        const bStarts = normalizeTitle(b.title).startsWith(clean) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.title.localeCompare(b.title);
      })
      .slice(0, 6);
  }, [query, guesses]);

  useEffect(() => {
    setActiveIdx(0);
  }, [suggestions.length, query]);

  const commitGuess = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmitGuess(trimmed);
    setQuery('');
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setDropdownOpen(true);
      setActiveIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setDropdownOpen(true);
      setActiveIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownOpen && suggestions[activeIdx]) {
        commitGuess(suggestions[activeIdx].title);
      } else if (query.trim()) {
        commitGuess(query);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <div
      key={shakeKey}
      className={`w-full max-w-[400px] rounded-[18px] bg-[#1B1B1B] border-2 border-[#2D2D2D] p-5 sm:p-6 shadow-[0_24px_56px_rgba(0,0,0,0.6)] ${
        shakeKey > 0 ? 'animate-wrong-shake' : ''
      }`}
    >
      {/* Header & Explicit Attempt Indicator */}
      <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-[#2D2D2D]">
        <div>
          <p className="text-xs font-semibold text-[#159BE0] flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Poster Restored</span>
          </p>
          <h2
            className="mt-1 text-2xl font-extrabold text-[#F0F0F0] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Name the Film
          </h2>
        </div>

        {/* Attempt counter: visual markers paired with explicit text */}
        <div className="text-right shrink-0">
          <div className="text-xs font-medium text-[#9F9FAA] tabular-nums">
            {remaining} {remaining === 1 ? 'try' : 'tries'} left
          </div>
          <div className="mt-1.5 flex items-center justify-end gap-1.5" aria-hidden="true">
            {Array.from({ length: maxGuesses }, (_, i) => {
              const isMissed = i < guesses.length;
              const isCurrent = i === guesses.length;
              return (
                <span
                  key={i}
                  className={`h-2 w-6 rounded-xs transition-colors ${
                    isMissed
                      ? 'bg-[#FF6463]'
                      : isCurrent
                      ? 'bg-[#F96922]'
                      : 'bg-[#2D2D2D]'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Autocomplete Search Form */}
      <div className="mt-5 relative">
        <label
          htmlFor="bollywood-guess-input"
          className="block text-xs font-medium text-[#9F9FAA] mb-2"
        >
          Search Bollywood film title or acronym
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717D]"
          />
          <input
            ref={inputRef}
            id="bollywood-guess-input"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Sholay, Lagaan, 3 Idiots..."
            className="w-full h-11 pl-10 pr-4 rounded-[11px] bg-[#111111] border border-[#2D2D2D] text-sm text-[#F0F0F0] placeholder:text-[#71717D] focus:outline-none focus:border-[#F96922] focus:ring-1 focus:ring-[#F96922]"
          />
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {dropdownOpen && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 mt-1.5 z-40 rounded-[12px] bg-[#222226] border border-[#303036] shadow-2xl overflow-hidden divide-y divide-[#2D2D2D]"
          >
            {suggestions.map((entry, idx) => (
              <li key={entry.title} role="option" aria-selected={idx === activeIdx}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitGuess(entry.title);
                  }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`w-full px-3.5 py-2.5 text-left flex items-baseline justify-between gap-3 transition-colors ${
                    idx === activeIdx
                      ? 'bg-[#F96922]/20 text-[#F0F0F0]'
                      : 'text-[#D8D8DF] hover:bg-[#F0F0F0]/5'
                  }`}
                >
                  <span className="text-sm font-medium truncate">{entry.title}</span>
                  <span className="text-xs text-[#9F9FAA] font-mono tabular-nums shrink-0">
                    {entry.year}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3.5 flex items-center gap-2.5">
          <button
            type="button"
            disabled={!query.trim()}
            onClick={() => commitGuess(query)}
            className="flex-1 h-11 px-5 rounded-[11px] bg-[#F96922] text-white text-sm font-bold hover:bg-[#FF7A38] shadow-[0_3px_0_#793715] active:translate-y-[1px] active:shadow-[0_1px_0_#793715] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
          >
            Submit Guess
          </button>
          <button
            type="button"
            onClick={onGiveUp}
            className="h-11 px-4 rounded-[11px] border border-[#2D2D2D] bg-[#141414] text-xs font-semibold text-[#9F9FAA] hover:text-[#F0F0F0] hover:border-[#42424A] transition-colors whitespace-nowrap cursor-pointer"
          >
            Reveal
          </button>
        </div>
      </div>

      {/* Missed Guesses Log */}
      {guesses.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#2D2D2D]">
          <p className="text-xs text-[#71717D] mb-2">Previous guesses</p>
          <ul className="space-y-1.5">
            {guesses.map((g, i) => (
              <li
                key={`${g}-${i}`}
                className="flex items-center gap-2 text-sm text-[#FF6463]"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span className="line-through text-[#9F9FAA] truncate">{g}</span>
                <span className="text-xs font-medium text-[#FF6463] shrink-0">Miss</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progressive Film Clues */}
      <div className="mt-5 pt-4 border-t border-[#2D2D2D] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#F0F0F0]">Production Clues</span>
          {!dialogueClueUsed && (
            <button
              type="button"
              onClick={onUnlockDialogueClue}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#159BE0] hover:text-[#92D9FE] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Dialogue Hint (-75 pts)</span>
            </button>
          )}
        </div>

        {/* Always-available Era hint & progressive unlocked clues */}
        <div className="space-y-2 text-xs text-[#D8D8DF]">
          <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-[#26262A]">
            <span className="text-[#71717D]">Era & Style</span>
            <span className="text-right font-medium">{film.eraLabel}</span>
          </div>

          <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-[#26262A]">
            <span className="text-[#71717D]">Year & Genre</span>
            {wrongCount >= 1 ? (
              <span className="text-right font-medium text-[#F0F0F0] tabular-nums">
                {film.year} · {film.genre}
              </span>
            ) : (
              <span className="text-[#71717D]">Unlocks after 1st miss</span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="text-[#71717D] shrink-0">Director & Cast</span>
            {wrongCount >= 2 ? (
              <span className="text-right font-medium text-[#F0F0F0]">
                {film.director} · {film.cast.slice(0, 2).join(', ')}
              </span>
            ) : (
              <span className="text-[#71717D]">Unlocks after 2nd miss</span>
            )}
          </div>
        </div>

        {dialogueClueUsed && (
          <div className="mt-2 p-3 rounded-[10px] bg-[#111111] border border-[#159BE0]/40">
            <p className="text-[11px] font-semibold text-[#92D9FE] mb-1">Iconic Dialogue</p>
            <p className="text-sm italic text-[#F0F0F0] leading-relaxed">
              {film.dialogueHint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
