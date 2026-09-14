import type { HintStatus, ItemField, ItemGuessHints, ItemGrade, NormalizedItem, WordlerItem } from '../types';
import { searchEntries } from './search.ts';
import { shuffle } from './shuffle.ts';

export const ITEM_FIELDS: ItemField[] = ['category', 'grade', 'type', 'options', 'uniqueEffect'];
export const ITEM_LABELS: Record<ItemField, string> = {
  category: '종류', grade: '등급', type: '유형', options: '옵션', uniqueEffect: '고유 효과',
};

const itemTypeLabels = { Weapon: '무기', Armor: '방어구' } as const;
const subTypeLabels: Record<string, string> = {
  OneHandSword: '단검', TwoHandSword: '양손검', DualSword: '쌍검', Hammer: '망치', Axe: '도끼', Spear: '창', Bat: '방망이', Whip: '채찍', Glove: '글러브', Tonfa: '톤파', DirectFire: '암기', HighAngleFire: '투척', Bow: '활', CrossBow: '석궁', Pistol: '권총', AssaultRifle: '돌격 소총', SniperRifle: '저격총', Nunchaku: '쌍절곤', Guitar: '기타', Camera: '카메라', Arcana: '아르카나', VFArm: 'VF의수', Rapier: '레이피어', Head: '머리', Chest: '옷', Arm: '팔', Leg: '다리',
};
const gradeLabels: Record<ItemGrade, string> = { Epic: '영웅', Legend: '전설', Mythic: '초월' };
const mainTypeLabels: Record<string, string> = { Main_Attack: '공격', Main_Skill: '스킬', Main_Hybrid: '하이브리드', Main_Tank: '탱커' };
const optionLabels: Record<string, string> = {
  Sub1_AttackSpeed: '공격 속도', Sub1_Cooldown: '쿨다운 감소', Sub2_MaxHP: '최대 체력', Sub1_SkillAmpRatio: '스킬 증폭', Sub1_Tank: '방어', Sub2_ArmorPenetrate: '방어 관통', Ex_Mobility: '기동성', Sub1_Critical: '치명타', Sub3_Drain: '흡혈', Ex_Sight: '시야', Sub1_BasicAttack: '기본 공격',
};
const gradeOrder: ItemGrade[] = ['Epic', 'Legend', 'Mythic'];

export function normalizeSkillGroup(group: string): string {
  return group.replace(/\[[^\]]+\]/g, '').trim();
}

export function hiddenItemFields(mode: import('../types').GameMode, guessIndex: number, singleField: ItemField, revealOrder = ITEM_FIELDS): ItemField[] {
  if (mode === 'sealed') return shuffledItemFields().slice(0, 2);
  if (mode === 'fog') return revealOrder.slice(Math.min(guessIndex + 1, revealOrder.length));
  if (mode === 'single' || mode === 'manly') return ITEM_FIELDS.filter(field => field !== singleField);
  return [];
}

export function shuffledItemFields(): ItemField[] {
  return shuffle(ITEM_FIELDS);
}

export function normalizeItem(item: WordlerItem): NormalizedItem {
  const mainType = item.searchTags.find(tag => tag.startsWith('Main_')) ?? '';
  const optionTags = item.searchTags.filter(tag => !tag.startsWith('Main_'));
  return {
    ...item,
    categoryLabel: `${itemTypeLabels[item.itemType]} · ${subTypeLabels[item.subType] ?? item.subType}`,
    gradeLabel: gradeLabels[item.grade],
    mainType,
    mainTypeLabel: mainTypeLabels[mainType] ?? mainType,
    optionTags,
    optionLabels: optionTags.map(tag => optionLabels[tag] ?? tag),
    effectGroups: [...new Set(item.itemSkillGroups.map(normalizeSkillGroup))],
  };
}

function sameSet(guess: string[], answer: string[]): boolean {
  const g = new Set(guess);
  const a = new Set(answer);
  return g.size === a.size && [...g].every(value => a.has(value));
}

export function compareItemOptions(guess: string[], answer: string[]): HintStatus {
  if (sameSet(guess, answer)) return 'exact';
  const a = new Set(answer);
  return guess.some(value => a.has(value)) ? 'partial' : 'wrong';
}

export function compareItemEffects(guess: string[], answer: string[]): HintStatus {
  if (sameSet(guess, answer)) return 'exact';
  const effects = new Set(answer);
  return guess.some(value => effects.has(value)) ? 'partial' : 'wrong';
}

export function buildItemGuessHints(guess: NormalizedItem, answer: NormalizedItem): ItemGuessHints {
  const category: HintStatus = guess.subType === answer.subType ? 'exact' : guess.itemType === answer.itemType ? 'partial' : 'wrong';
  const grade: HintStatus = guess.grade === answer.grade ? 'exact' : gradeOrder.indexOf(guess.grade) < gradeOrder.indexOf(answer.grade) ? 'higher' : 'lower';
  return {
    category: { value: guess.categoryLabel, status: category },
    grade: { value: guess.gradeLabel, status: grade },
    type: { value: guess.mainTypeLabel, status: guess.mainType === answer.mainType ? 'exact' : 'wrong' },
    options: { value: guess.optionLabels.length ? guess.optionLabels : ['없음'], status: compareItemOptions(guess.optionTags, answer.optionTags) },
    uniqueEffect: { value: guess.effectGroups.length ? guess.effectGroups : ['없음'], status: compareItemEffects(guess.effectGroups, answer.effectGroups) },
  };
}

export function isCorrectItemGuess(guess: WordlerItem, answer: WordlerItem): boolean {
  return guess.code === answer.code;
}

export function searchItems(items: NormalizedItem[], query: string): NormalizedItem[] {
  return searchEntries(items, query, item => [item.name, item.englishName, String(item.code)]);
}
