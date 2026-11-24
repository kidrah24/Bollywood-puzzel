import type {
  DifficultyConfig,
  PlayerStats,
  RoundResult,
  TileItem,
} from '../types/game';

const STORAGE_KEY = 'bollywood_cut_stats_v1';

/** Deterministic PRNG (Mulberry32) so Daily Cuts deal identical boards for everyone. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates a full derangement of 0..total-1 so NO tile starts pre-locked.
 */
export function createShuffledBoard(total: number, seedString?: string): TileItem[] {
  const rng = seedString ? mulberry32(hashSeed(seedString)) : Math.random;
  const indices = Array.from({ length: total }, (_, i) => i);

  // Sattolo's algorithm produces a single-cycle derangement (guaranteed 0 fixed points!)
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rng() * i);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Add one random non-fixing swap so the cycle structure isn't trivially predictable
  if (total >= 6) {
    const a = Math.floor(rng() * total);
    let b = (a + 2) % total;
    if (indices[a] !== b && indices[b] !== a) {
      [indices[a], indices[b]] = [indices[b], indices[a]];
    }
  }

  return indices.map((pieceId, slotIndex) => ({
    pieceId,
    locked: pieceId === slotIndex,
  }));
}

export function formatTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateScore(params: {
  difficulty: DifficultyConfig;
  timeSeconds: number;
  penaltySeconds: number;
  moves: number;
  hintsUsed: number;
  dialogueClueUsed: boolean;
  guessesUsed: number;
  identified: boolean;
}): { score: number; stars: 1 | 2 | 3 } {
  const {
    difficulty,
    timeSeconds,
    penaltySeconds,
    moves,
    hintsUsed,
    dialogueClueUsed,
    guessesUsed,
    identified,
  } = params;

  const effectiveTime = timeSeconds + penaltySeconds;

  // Puzzle reconstruction component: up to 600 points
  const moveOverage = Math.max(0, moves - difficulty.parMoves);
  const timeOverage = Math.max(0, effectiveTime - difficulty.targetSeconds);
  const puzzlePoints = Math.max(
    180,
    600 - moveOverage * 16 - Math.floor(timeOverage * 3.5) - hintsUsed * 55
  );

  // Film identification component: up to 400 points
  let idPoints = 0;
  if (identified) {
    const guessDeduction = Math.max(0, guessesUsed - 1) * 95;
    const clueDeduction = dialogueClueUsed ? 75 : 0;
    idPoints = Math.max(120, 400 - guessDeduction - clueDeduction);
  }

  const total = Math.min(1000, Math.max(100, Math.round(puzzlePoints + idPoints)));

  let stars: 1 | 2 | 3 = 1;
  if (identified && total >= 820) {
    stars = 3;
  } else if (identified && total >= 560) {
    stars = 2;
  }

  return { score: total, stars };
}

export function buildShareText(result: RoundResult, difficulty: DifficultyConfig): string {
  const header =
    result.mode === 'daily' && result.dailyCutNumber
      ? `BOLLYWOOD CUT #${result.dailyCutNumber} · ${difficulty.label} (${difficulty.cols}×${difficulty.rows})`
      : `BOLLYWOOD CUT · Studio Reel (${difficulty.cols}×${difficulty.rows})`;

  const starStr = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
  const effectiveTime = result.timeSeconds + result.penaltySeconds;
  const guessDots = Array.from({ length: 3 }, (_, idx) => {
    if (idx < result.guesses.length - 1) return '🟥';
    if (idx === result.guesses.length - 1) return result.identified ? '🟩' : '🟥';
    return '⬛';
  }).join('');

  return [
    header,
    `${starStr}  ${result.score}/1000`,
    `⏱ ${formatTime(effectiveTime)}  ·  ✂️ ${result.moves} swaps  ·  🎬 ${guessDots}`,
    result.identified ? 'Poster restored & film identified!' : 'Poster restored!',
  ].join('\n');
}

export function loadPlayerStats(): PlayerStats {
  const fallback: PlayerStats = {
    dailyStreak: 0,
    lastDailyDate: null,
    totalCompleted: 0,
    records: {},
    muted: false,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
      lastDailyDate: typeof parsed.lastDailyDate === 'string' ? parsed.lastDailyDate : null,
      totalCompleted: typeof parsed.totalCompleted === 'number' ? parsed.totalCompleted : 0,
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
      muted: Boolean(parsed.muted),
    };
  } catch {
    return fallback;
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}
