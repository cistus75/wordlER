export type Gender = '남성' | '여성' | '미정';
export type AttackRange = '근거리' | '원거리';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  roles: string[];
  ranges: AttackRange[];
  weapons: string[];
  age: number | null;
  height: number | null;
  weight: number | null;
  miniImage?: string;
  fullImage?: string;
}

export type GameMode = 'normal' | 'censored';
export type GameStatus = 'playing' | 'won' | 'lost';

export type ComparableField =
  | 'gender'
  | 'roles'
  | 'ranges'
  | 'weapons'
  | 'age'
  | 'height'
  | 'weight';

export type HintStatus = 'exact' | 'partial' | 'wrong' | 'higher' | 'lower';

export interface FieldHint<T> {
  value: T;
  status: HintStatus;
}

export interface GuessHints {
  gender: FieldHint<Gender>;
  roles: FieldHint<string[]>;
  ranges: FieldHint<AttackRange[]>;
  weapons: FieldHint<string[]>;
  age: FieldHint<number | null>;
  height: FieldHint<number | null>;
  weight: FieldHint<number | null>;
}

export interface GuessResult {
  character: Character;
  hints: GuessHints;
  hiddenFields: ComparableField[];
}
