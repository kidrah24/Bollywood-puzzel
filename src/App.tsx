import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { IdentifyPanel } from './components/IdentifyPanel';
import { PauseModal } from './components/PauseModal';
import { PosterBoard } from './components/PosterBoard';
import { RoundSummaryModal } from './components/RoundSummaryModal';
import { TitleScreen } from './components/TitleScreen';
import {
  DIFFICULTIES,
  FEATURED_MOVIES,
  getDailyCutNumber,
  getDailyMovieIndex,
  getLocalDateKey,
  isMatchingMovie,
} from './data/movies';
import type {
  DifficultyKey,
  GameMode,
  GameState,
  PlayerStats,
  RoundResult,
  TileItem,
} from './types/game';
import {
  calculateScore,
  createShuffledBoard,
  loadPlayerStats,
  savePlayerStats,
} from './utils/puzzle';
import { sound } from './utils/sound';

const MAX_GUESSES = 3;

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(() => {
    const loaded = loadPlayerStats();
    sound.setMuted(loaded.muted);
    return loaded;
  });

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [previousState, setPreviousState] = useState<'PLAYING' | 'IDENTIFYING'>('PLAYING');
  const [mode, setMode] = useState<GameMode>('daily');
  const [difficultyKey, setDifficultyKey] = useState<DifficultyKey>('boxoffice');
  const [reelIndex, setReelIndex] = useState<number>(0);

  // Active round state
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [penaltySeconds, setPenaltySeconds] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [recentlyLocked, setRecentlyLocked] = useState<number[]>([]);
  const [hintHighlight, setHintHighlight] = useState<[number, number] | null>(null);
  const [comboBanner, setComboBanner] = useState<{ count: number; id: number } | null>(null);

  // Phase 2 identification state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [dialogueClueUsed, setDialogueClueUsed] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  const comboCountRef = useRef<number>(0);
  const peekTimerRef = useRef<number | null>(null);
  const lockFlashTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  const todayKey = useMemo(() => getLocalDateKey(), []);
  const dailyCutNumber = useMemo(() => getDailyCutNumber(), []);
  const dailyMovieIndex = useMemo(() => getDailyMovieIndex(), []);

  const activeMovieIndex = mode === 'daily' ? dailyMovieIndex : reelIndex;
  const activeFilm = FEATURED_MOVIES[activeMovieIndex] ?? FEATURED_MOVIES[0];
  const difficulty = DIFFICULTIES[difficultyKey];
  const totalTiles = difficulty.cols * difficulty.rows;

  const lockedCount = useMemo(
    () => tiles.reduce((acc, t) => acc + (t.locked ? 1 : 0), 0),
    [tiles]
  );
  const isPosterSolved = tiles.length > 0 && lockedCount === tiles.length;
  const dailySolvedToday = stats.lastDailyDate === todayKey;

  const clearTransientTimers = useCallback(() => {
    if (peekTimerRef.current) {
      window.clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }
    if (lockFlashTimerRef.current) {
      window.clearTimeout(lockFlashTimerRef.current);
      lockFlashTimerRef.current = null;
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTransientTimers, [clearTransientTimers]);

  const startRound = useCallback(
    (nextMode: GameMode, nextDiff: DifficultyKey, nextReelIdx: number) => {
      clearTransientTimers();
      const cfg = DIFFICULTIES[nextDiff];
      const count = cfg.cols * cfg.rows;
      const seed =
        nextMode === 'daily' ? `daily-${todayKey}-${nextDiff}` : undefined;

      setMode(nextMode);
      setDifficultyKey(nextDiff);
      setReelIndex(nextReelIdx);
      setTiles(createShuffledBoard(count, seed));
      setMoves(0);
      setTimeSeconds(0);
      setPenaltySeconds(0);
      setHintsUsed(0);
      setIsPeeking(false);
      setRecentlyLocked([]);
      setHintHighlight(null);
      comboCountRef.current = 0;
      setComboBanner(null);
      setGuesses([]);
      setDialogueClueUsed(false);
      setShakeKey(0);
      setRoundResult(null);
      setGameState('PLAYING');
    },
    [clearTransientTimers, todayKey]
  );

  // Accurate 1-second stopwatch active ONLY during reconstruction ('PLAYING')
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = window.setInterval(() => {
      setTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState]);

  const handleToggleMute = useCallback(() => {
    setStats((prev) => {
      const nextMuted = !prev.muted;
      sound.setMuted(nextMuted);
      const updated = { ...prev, muted: nextMuted };
      savePlayerStats(updated);
      return updated;
    });
  }, []);

  const handleSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (gameState !== 'PLAYING') return;
      if (fromIndex === toIndex) return;
      if (
        !tiles[fromIndex] ||
        !tiles[toIndex] ||
        tiles[fromIndex].locked ||
        tiles[toIndex].locked
      ) {
        return;
      }

      const next = [...tiles];
      const pieceA = next[fromIndex].pieceId;
      const pieceB = next[toIndex].pieceId;

      const aLocksNow = pieceB === fromIndex;
      const bLocksNow = pieceA === toIndex;

      next[fromIndex] = { pieceId: pieceB, locked: aLocksNow };
      next[toIndex] = { pieceId: pieceA, locked: bLocksNow };

      const newlyLocked: number[] = [];
      if (aLocksNow) newlyLocked.push(fromIndex);
      if (bLocksNow) newlyLocked.push(toIndex);

      const allLocked = next.every((t) => t.locked);

      setTiles(next);
      setMoves((m) => m + 1);
      setHintHighlight(null);

      if (allLocked) {
        setRecentlyLocked(newlyLocked);
        sound.playPosterComplete();
        setGameState('IDENTIFYING');
      } else if (newlyLocked.length > 0) {
        setRecentlyLocked(newlyLocked);
        if (lockFlashTimerRef.current) {
          window.clearTimeout(lockFlashTimerRef.current);
        }
        lockFlashTimerRef.current = window.setTimeout(() => {
          setRecentlyLocked([]);
        }, 460);

        const nextCombo = comboCountRef.current + newlyLocked.length;
        comboCountRef.current = nextCombo;
        sound.playLock(nextCombo);
        if (nextCombo >= 2) {
          setComboBanner({ count: nextCombo, id: Date.now() });
        }
      } else {
        comboCountRef.current = 0;
        sound.playSwap();
      }
    },
    [gameState, tiles]
  );

  const handlePeek = useCallback(() => {
    if (gameState !== 'PLAYING' || isPeeking) return;
    sound.playHint();
    setHintsUsed((h) => h + 1);
    setPenaltySeconds((p) => p + 5);
    setIsPeeking(true);

    // Also briefly highlight a helpful swap pair after peek fades
    const unlockedSlot = tiles.findIndex((t) => !t.locked);
    if (unlockedSlot !== -1) {
      const pieceOwnerSlot = tiles.findIndex((t) => t.pieceId === unlockedSlot);
      if (pieceOwnerSlot !== -1 && pieceOwnerSlot !== unlockedSlot) {
        setHintHighlight([unlockedSlot, pieceOwnerSlot]);
        if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = window.setTimeout(() => setHintHighlight(null), 3200);
      }
    }

    if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
    peekTimerRef.current = window.setTimeout(() => {
      setIsPeeking(false);
    }, 1500);
  }, [gameState, isPeeking, tiles]);

  const handleAutoSplice = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const targetSlot = tiles.findIndex((t) => !t.locked);
    if (targetSlot === -1) return;
    const sourceSlot = tiles.findIndex((t) => t.pieceId === targetSlot);
    if (sourceSlot === -1 || sourceSlot === targetSlot) return;

    setHintsUsed((h) => h + 1);
    setPenaltySeconds((p) => p + 10);
    handleSwap(sourceSlot, targetSlot);
  }, [gameState, tiles, handleSwap]);

  // Global keyboard shortcuts (Esc to pause/resume, M to mute, P peek, H splice)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape' && gameState === 'IDENTIFYING') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'IDENTIFYING') {
          setPreviousState(gameState);
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState(previousState);
        }
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (gameState === 'PLAYING' && e.key.toLowerCase() === 'p') {
        handlePeek();
      } else if (gameState === 'PLAYING' && e.key.toLowerCase() === 'h') {
        handleAutoSplice();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, previousState, handleToggleMute, handlePeek, handleAutoSplice]);

  const finishRound = useCallback(
    (finalGuesses: string[], identified: boolean) => {
      const { score, stars } = calculateScore({
        difficulty,
        timeSeconds,
        penaltySeconds,
        moves,
        hintsUsed,
        dialogueClueUsed,
        guessesUsed: finalGuesses.length,
        identified,
      });

      const effectiveTime = timeSeconds + penaltySeconds;
      const result: RoundResult = {
        movieId: activeFilm.id,
        mode,
        difficulty: difficultyKey,
        timeSeconds,
        penaltySeconds,
        moves,
        parMoves: difficulty.parMoves,
        hintsUsed,
        dialogueClueUsed,
        guesses: finalGuesses,
        identified,
        score,
        stars,
        dailyCutNumber: mode === 'daily' ? dailyCutNumber : undefined,
      };

      setRoundResult(result);
      setGameState('ROUND_SUMMARY');

      if (identified) {
        sound.playVictory();
      } else {
        sound.playWrongGuess();
      }

      setStats((prev) => {
        const prevRec = prev.records[activeFilm.id];
        const nextRec = {
          bestScore: prevRec ? Math.max(prevRec.bestScore, score) : score,
          bestTime: prevRec ? Math.min(prevRec.bestTime, effectiveTime) : effectiveTime,
          stars: (prevRec ? Math.max(prevRec.stars, stars) : stars) as 1 | 2 | 3,
          identified: Boolean(prevRec?.identified || identified),
        };

        let nextStreak = prev.dailyStreak;
        let nextLastDaily = prev.lastDailyDate;
        if (mode === 'daily' && prev.lastDailyDate !== todayKey) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = getLocalDateKey(yesterday);
          nextStreak = prev.lastDailyDate === yesterdayKey ? prev.dailyStreak + 1 : 1;
          nextLastDaily = todayKey;
        }

        const updated: PlayerStats = {
          ...prev,
          dailyStreak: nextStreak,
          lastDailyDate: nextLastDaily,
          totalCompleted: prev.totalCompleted + 1,
          records: {
            ...prev.records,
            [activeFilm.id]: nextRec,
          },
        };
        savePlayerStats(updated);
        return updated;
      });
    },
    [
      activeFilm.id,
      dailyCutNumber,
      dialogueClueUsed,
      difficulty,
      difficultyKey,
      hintsUsed,
      mode,
      moves,
      penaltySeconds,
      timeSeconds,
      todayKey,
    ]
  );

  const handleSubmitGuess = useCallback(
    (guess: string) => {
      if (gameState !== 'IDENTIFYING') return;
      const nextGuesses = [...guesses, guess];
      setGuesses(nextGuesses);

      if (isMatchingMovie(guess, activeFilm)) {
        finishRound(nextGuesses, true);
      } else if (nextGuesses.length >= MAX_GUESSES) {
        finishRound(nextGuesses, false);
      } else {
        sound.playWrongGuess();
        setShakeKey((k) => k + 1);
      }
    },
    [gameState, guesses, activeFilm, finishRound]
  );

  const handleGiveUp = useCallback(() => {
    if (gameState !== 'IDENTIFYING') return;
    finishRound(guesses, false);
  }, [gameState, guesses, finishRound]);

  const handleNextReel = useCallback(() => {
    if (mode === 'daily') {
      // Transition cleanly into Studio Reel starting at the next poster
      const nextIdx = (dailyMovieIndex + 1) % FEATURED_MOVIES.length;
      startRound('reel', difficultyKey, nextIdx);
    } else {
      const nextIdx = (reelIndex + 1) % FEATURED_MOVIES.length;
      startRound('reel', difficultyKey, nextIdx);
    }
  }, [mode, dailyMovieIndex, reelIndex, difficultyKey, startRound]);

  const handlePlayRandom = useCallback(() => {
    const unsolvedIndices = FEATURED_MOVIES.map((m, idx) => ({ m, idx }))
      .filter(({ m }) => !stats.records[m.id]?.identified)
      .map(({ idx }) => idx);
    const pool =
      unsolvedIndices.length > 0
        ? unsolvedIndices
        : FEATURED_MOVIES.map((_, idx) => idx);
    const chosen = pool[Math.floor(Math.random() * pool.length)] ?? 0;
    startRound('reel', difficultyKey, chosen);
  }, [stats.records, difficultyKey, startRound]);

  if (gameState === 'TITLE_MENU') {
    const dailyFilm = FEATURED_MOVIES[dailyMovieIndex] ?? FEATURED_MOVIES[0];
    return (
      <TitleScreen
        difficulty={difficultyKey}
        dailyFilm={dailyFilm}
        dailyCutNumber={dailyCutNumber}
        dailySolvedToday={dailySolvedToday}
        stats={stats}
        muted={stats.muted}
        onSelectDifficulty={setDifficultyKey}
        onPlayDaily={() => startRound('daily', difficultyKey, dailyMovieIndex)}
        onPlayReel={(idx) => startRound('reel', difficultyKey, idx)}
        onPlayRandom={handlePlayRandom}
        onToggleMute={handleToggleMute}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#111111] text-[#F0F0F0] flex flex-col overflow-x-hidden">
      <GameHud
        gameState={gameState}
        mode={mode}
        dailyCutNumber={dailyCutNumber}
        reelIndex={reelIndex}
        totalReels={FEATURED_MOVIES.length}
        difficulty={difficulty}
        timeSeconds={timeSeconds}
        penaltySeconds={penaltySeconds}
        moves={moves}
        lockedCount={lockedCount}
        totalTiles={totalTiles}
        isPeeking={isPeeking}
        muted={stats.muted}
        onBack={() => {
          clearTransientTimers();
          setGameState('TITLE_MENU');
        }}
        onPeek={handlePeek}
        onAutoSplice={handleAutoSplice}
        onToggleMute={handleToggleMute}
        onPause={() => {
          if (gameState === 'PLAYING' || gameState === 'IDENTIFYING') {
            setPreviousState(gameState);
            setGameState('PAUSED');
          }
        }}
      />

      {/* Active Play / Identification Stage */}
      <main className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-5 sm:py-7">
        {/* Subtle GoDubDub orange studio ambient light behind the board */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(249,105,34,0.08),transparent_62%)]"
        />

        <div
          className={`relative z-10 w-full max-w-[1060px] flex flex-col items-center justify-center gap-6 lg:gap-10 transition-all duration-300 ${
            gameState === 'IDENTIFYING' || gameState === 'ROUND_SUMMARY'
              ? 'lg:flex-row lg:items-center'
              : ''
          }`}
        >
          {/* Poster Cutting Board */}
          <div className="flex flex-col items-center">
            <PosterBoard
              film={activeFilm}
              difficulty={difficulty}
              tiles={tiles}
              isSolved={isPosterSolved}
              isInteractive={gameState === 'PLAYING'}
              isPeeking={isPeeking}
              recentlyLocked={recentlyLocked}
              hintHighlight={hintHighlight}
              comboBanner={comboBanner}
              onSwap={handleSwap}
              onPickup={() => sound.playPickup()}
            />

            {/* Single quiet instruction line beneath board during reconstruction */}
            {gameState === 'PLAYING' && (
              <p className="mt-4 text-xs text-[#9F9FAA] text-center">
                Drag or click two pieces to swap · Correct pieces snap-lock automatically
              </p>
            )}
          </div>

          {/* Phase 2: Movie Identification Slate */}
          {gameState === 'IDENTIFYING' && (
            <IdentifyPanel
              film={activeFilm}
              guesses={guesses}
              maxGuesses={MAX_GUESSES}
              dialogueClueUsed={dialogueClueUsed}
              shakeKey={shakeKey}
              onSubmitGuess={handleSubmitGuess}
              onUnlockDialogueClue={() => {
                sound.playHint();
                setDialogueClueUsed(true);
              }}
              onGiveUp={handleGiveUp}
            />
          )}
        </div>
      </main>

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          difficulty={difficultyKey}
          onResume={() => setGameState(previousState)}
          onRestart={() => startRound(mode, difficultyKey, reelIndex)}
          onChangeDifficulty={(nextDiff) => startRound(mode, nextDiff, reelIndex)}
          onReturnTitle={() => {
            clearTransientTimers();
            setGameState('TITLE_MENU');
          }}
        />
      )}

      {/* Round Complete / Victory Summary Modal */}
      {gameState === 'ROUND_SUMMARY' && roundResult && (
        <RoundSummaryModal
          film={activeFilm}
          result={roundResult}
          hasNextReel={reelIndex < FEATURED_MOVIES.length - 1}
          onNextReel={handleNextReel}
          onReplay={() => startRound(mode, difficultyKey, reelIndex)}
          onReturnTitle={() => {
            clearTransientTimers();
            setGameState('TITLE_MENU');
          }}
        />
      )}
    </div>
  );
}
