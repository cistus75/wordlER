export interface Character {
  id: string;
  name: string;
  roles: string[];
  weapons: string[];
  age: number | null;
  height: number | null;
  risk: string;
}
export type GameStatus = 'playing' | 'round-won' | 'won' | 'lost';
export type GameMode = 'classic' | 'sealed' | 'fog' | 'single' | 'coward' | 'manly' | 'cipher' | 'liar' | 'relay';
export type ComparableField = 'roles' | 'weapons' | 'age' | 'height' | 'risk';
export type HintStatus = 'exact' | 'partial' | 'wrong' | 'higher' | 'lower';
export interface FieldHint<T> { value: T; status: HintStatus }
export type GuessHints = { [K in ComparableField]: FieldHint<Character[K]> };
export interface GuessResult {
  character: Character;
  hints: GuessHints;
  hiddenFields: ComparableField[];
  lie?: { field: ComparableField; truth: HintStatus };
}

export type ItemType = 'Weapon' | 'Armor';
export type ItemGrade = 'Epic' | 'Legend' | 'Mythic';
export interface WordlerItem {
  code: number;
  name: string;
  englishName: string;
  itemType: ItemType;
  subType: string;
  grade: ItemGrade;
  statTags: string[];
  searchTags: string[];
  itemSkillGroups: string[];
  itemSkills: unknown[];
  image: string;
}
export type ItemField = 'category' | 'grade' | 'type' | 'options' | 'uniqueEffect';
export interface NormalizedItem extends WordlerItem {
  categoryLabel: string;
  gradeLabel: string;
  mainType: string;
  mainTypeLabel: string;
  optionTags: string[];
  optionLabels: string[];
  effectGroups: string[];
}
export type ItemGuessHints = Record<ItemField, FieldHint<string | string[]>>;
export interface ItemGuessResult {
  item: NormalizedItem;
  hints: ItemGuessHints;
  hiddenFields: ItemField[];
  sameProfile: boolean;
  lie?: { field: ItemField; truth: HintStatus };
}

