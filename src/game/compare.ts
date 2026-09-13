import type { Character, ComparableField, GameMode, GuessHints, HintStatus } from '../types';
export const COMPARABLE_FIELDS: ComparableField[] = ['roles', 'weapons', 'age', 'height', 'risk'];
export function randomFields(count: number): ComparableField[] {
  const pool = [...COMPARABLE_FIELDS];
  const fields: ComparableField[] = [];
  const limit = Math.max(0, Math.min(count, pool.length));
  while (fields.length < limit) {
    fields.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return fields;
}
export function hiddenFields(mode: GameMode, guessIndex: number, singleField: ComparableField): ComparableField[] {
  if (mode === 'sealed') return randomFields(2);
  if (mode === 'fog') return randomFields(COMPARABLE_FIELDS.length - Math.min(guessIndex + 1, COMPARABLE_FIELDS.length));
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
  return answer < guess ? 'higher' : 'lower';
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

