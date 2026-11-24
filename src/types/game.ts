export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'IDENTIFYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY';

export type GameMode = 'daily' | 'reel';

export type DifficultyKey = 'matinee' | 'boxoffice' | 'directors';

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  cols: number;
  rows: number;
  parMoves: number;
  targetSeconds: number;
}

export interface BollywoodFilm {
  id: string;
  title: string;
  aliases: string[];
  year: number;
  genre: string;
  director: string;
  cast: string[];
  dialogueHint: string;
  trivia: string;
  posterUrl: string;
  aspectRatio: 'portrait' | 'square';
  fallbackGradient: string;
  eraLabel: string;
}

export interface CatalogEntry {
  title: string;
  year: number;
  director: string;
  aliases?: string[];
}

export interface TileItem {
  /** The true home index (0 .. total-1) in the original poster */
  pieceId: number;
  /** Whether this piece is snapped into its exact home position */
  locked: boolean;
}

export interface RoundResult {
  movieId: string;
  mode: GameMode;
  difficulty: DifficultyKey;
  timeSeconds: number;
  penaltySeconds: number;
  moves: number;
  parMoves: number;
  hintsUsed: number;
  dialogueClueUsed: boolean;
  guesses: string[];
  identified: boolean;
  score: number;
  stars: 1 | 2 | 3;
  dailyCutNumber?: number;
}

export interface FilmRecord {
  bestScore: number;
  bestTime: number;
  stars: 1 | 2 | 3;
  identified: boolean;
}

export interface PlayerStats {
  dailyStreak: number;
  lastDailyDate: string | null;
  totalCompleted: number;
  records: Record<string, FilmRecord>;
  muted: boolean;
}
