import type { Character, ComparableField, GameMode, GuessHints, HintStatus } from '../types';
import { shuffle } from './shuffle.ts';
export const COMPARABLE_FIELDS: ComparableField[] = ['roles', 'weapons', 'age', 'height', 'risk'];
const RISK_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
export function randomFields(count: number): ComparableField[] {
  return shuffle(COMPARABLE_FIELDS).slice(0, Math.max(0, Math.min(count, COMPARABLE_FIELDS.length)));
}
export function hiddenFields(mode: GameMode, guessIndex: number, singleField: ComparableField, revealOrder = COMPARABLE_FIELDS): ComparableField[] {
  if (mode === 'sealed') return randomFields(2);
  if (mode === 'fog') return revealOrder.slice(Math.min(guessIndex + 1, revealOrder.length));
  if (mode === 'single') return COMPARABLE_FIELDS.filter(field => field !== singleField);
  return [];
}
export function compareSet(guess: string[], answer: string[]): HintStatus {
  const a = new Set(guess);
  const b = new Set(answer);
  if (a.size === b.size && [...a].every(value => b.has(value))) return 'exact';
  return [...a].some(value => b.has(value)) ? 'partial' : 'wrong';
}
export function compareNumber(guess: number | null, answer: number | null): HintStatus {
  if (guess === answer) return 'exact';
  if (guess === null || answer === null) return 'wrong';
  return guess < answer ? 'higher' : 'lower';
}
export function compareRisk(guess: string, answer: string): HintStatus {
  if (guess === answer) return 'exact';
  return RISK_RANK[answer] < RISK_RANK[guess] ? 'higher' : 'lower';
}
export function buildGuessHints(guess: Character, answer: Character, mode: GameMode = 'classic'): GuessHints {
  return {
    roles: { value: guess.roles, status: compareSet(guess.roles, answer.roles) },
    weapons: { value: guess.weapons, status: compareSet(guess.weapons, answer.weapons) },
    age: { value: guess.age, status: compareNumber(guess.age, answer.age) },
    height: { value: guess.height, status: compareNumber(guess.height, answer.height) },
    risk: { value: guess.risk, status: mode === 'coward' ? compareRisk(guess.risk, answer.risk) : guess.risk === answer.risk ? 'exact' : 'wrong' },
  };
}
export function isCorrectGuess(guess: Character, answer: Character): boolean {
  return guess.id === answer.id;
}

