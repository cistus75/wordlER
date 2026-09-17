import type { GameMode, GameStatus } from '../types';

export const RELAY_ROUNDS = 3;
export const MAX_GUESSES = 5;
export const SUPER_COWARD_MAX_GUESSES = 10;
export const MANLY_MAX_GUESSES = 3;

export function maxGuessesForMode(mode: GameMode): number {
  if (mode === 'coward') return SUPER_COWARD_MAX_GUESSES;
  if (mode === 'manly') return MANLY_MAX_GUESSES;
  return mode === 'taboo' ? 7 : MAX_GUESSES;
}

export function guessStatus(mode: GameMode, correct: boolean, attempts: number, round: number): GameStatus {
  if (correct) return mode === 'relay' && round < RELAY_ROUNDS ? 'round-won' : 'won';
  return attempts >= maxGuessesForMode(mode) ? 'lost' : 'playing';
}
