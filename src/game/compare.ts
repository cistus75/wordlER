import type { Character, ComparableField, GuessHints, HintStatus } from '../types';
export const COMPARABLE_FIELDS: ComparableField[] = ['roles', 'weapons', 'age', 'height', 'risk'];
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
export function buildGuessHints(guess: Character, answer: Character): GuessHints {
  return {
    roles: { value: guess.roles, status: compareSet(guess.roles, answer.roles) },
    weapons: { value: guess.weapons, status: compareSet(guess.weapons, answer.weapons) },
    age: { value: guess.age, status: compareNumber(guess.age, answer.age) },
    height: { value: guess.height, status: compareNumber(guess.height, answer.height) },
    risk: { value: guess.risk, status: guess.risk === answer.risk ? 'exact' : 'wrong' },
  };
}
export function isCorrectGuess(guess: Character, answer: Character): boolean {
  return guess.id === answer.id;
}

