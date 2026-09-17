import type { GameMode, GameStatus, HintStatus } from '../types';

export const RELAY_ROUNDS = 3;
export const MAX_GUESSES = 5;
export const SUPER_COWARD_MAX_GUESSES = 10;
export const MANLY_MAX_GUESSES = 3;

export function maxGuessesForMode(mode: GameMode): number {
  if (mode === 'coward') return SUPER_COWARD_MAX_GUESSES;
  if (mode === 'manly') return MANLY_MAX_GUESSES;
  return MAX_GUESSES;
}

export function plantLie<K extends string, T extends Record<K, { status: HintStatus }>>(hints: T, fields: readonly K[], correct: boolean): { hints: T; lie?: { field: K; truth: HintStatus } } {
  if (correct) return { hints };
  const field = fields[Math.floor(Math.random() * fields.length)];
  const truth = hints[field].status;
  return { hints: { ...hints, [field]: { ...hints[field], status: truth === 'exact' ? 'wrong' : 'exact' } }, lie: { field, truth } };
}

export function exactCount(hints: Record<string, { status: HintStatus }>): number {
  return Object.values(hints).filter(hint => hint.status === 'exact').length;
}

export function guessStatus(mode: GameMode, correct: boolean, attempts: number, round: number): GameStatus {
  if (correct) return mode === 'relay' && round < RELAY_ROUNDS ? 'round-won' : 'won';
  return attempts >= maxGuessesForMode(mode) ? 'lost' : 'playing';
}
