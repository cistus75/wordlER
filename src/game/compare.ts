import type {
  Character,
  ComparableField,
  FieldHint,
  GuessHints,
  HintStatus,
} from '../types';

export const COMPARABLE_FIELDS: ComparableField[] = [
  'gender',
  'roles',
  'ranges',
  'weapons',
  'age',
  'height',
  'weight',
];

function normalizeSet(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ko'));
}

export function compareSet<T extends string>(guess: T[], answer: T[]): HintStatus {
  const normalizedGuess = normalizeSet(guess);
  const normalizedAnswer = normalizeSet(answer);

  const isExact =
    normalizedGuess.length === normalizedAnswer.length &&
    normalizedGuess.every((value, index) => value === normalizedAnswer[index]);

  if (isExact) return 'exact';

  const answerSet = new Set(normalizedAnswer);
  return normalizedGuess.some((value) => answerSet.has(value)) ? 'partial' : 'wrong';
}

export function compareNumber(
  guess: number | null,
  answer: number | null,
): HintStatus {
  if (guess === null || answer === null) {
    return guess === answer ? 'exact' : 'wrong';
  }

  if (guess === answer) return 'exact';
  return guess < answer ? 'higher' : 'lower';
}

export function buildGuessHints(guess: Character, answer: Character): GuessHints {
  return {
    gender: {
      value: guess.gender,
      status: guess.gender === answer.gender ? 'exact' : 'wrong',
    },
    roles: {
      value: guess.roles,
      status: compareSet(guess.roles, answer.roles),
    },
    ranges: {
      value: guess.ranges,
      status: compareSet(guess.ranges, answer.ranges),
    },
    weapons: {
      value: guess.weapons,
      status: compareSet(guess.weapons, answer.weapons),
    },
    age: {
      value: guess.age,
      status: compareNumber(guess.age, answer.age),
    },
    height: {
      value: guess.height,
      status: compareNumber(guess.height, answer.height),
    },
    weight: {
      value: guess.weight,
      status: compareNumber(guess.weight, answer.weight),
    },
  };
}

export function chooseHiddenFields(count: number): ComparableField[] {
  const pool = [...COMPARABLE_FIELDS];
  const hidden: ComparableField[] = [];
  const limit = Math.min(count, pool.length);

  while (hidden.length < limit) {
    const index = Math.floor(Math.random() * pool.length);
    hidden.push(pool.splice(index, 1)[0]);
  }

  return hidden;
}

export function isCorrectGuess(guess: Character, answer: Character): boolean {
  return guess.id === answer.id;
}

export function createFieldHint<T>(value: T, status: HintStatus): FieldHint<T> {
  return { value, status };
}
