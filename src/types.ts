export interface Character {
  id: string;
  name: string;
  roles: string[];
  weapons: string[];
  age: number | null;
  height: number | null;
  risk: string;
}
export type GameStatus = 'playing' | 'won' | 'lost';
export type ComparableField = 'roles' | 'weapons' | 'age' | 'height' | 'risk';
export type HintStatus = 'exact' | 'partial' | 'wrong' | 'higher' | 'lower';
export interface FieldHint<T> { value: T; status: HintStatus }
export type GuessHints = { [K in ComparableField]: FieldHint<Character[K]> };
export interface GuessResult {
  character: Character;
  hints: GuessHints;
}

