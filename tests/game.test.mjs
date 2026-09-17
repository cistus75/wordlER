import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchCharacters } from '../src/game/search.ts';
import { buildGuessHints, compareNumber, compareRisk, compareSet, hiddenFields, isCorrectGuess, randomFields } from '../src/game/compare.ts';
import { maxGuessesForMode, guessStatus, RELAY_ROUNDS } from '../src/game/rules.ts';
import { itemGuessCost } from '../src/game/item.ts';
import { applyGameResult, clearStats, emptyStats, getStatsStorageKey, loadStats, recordGame } from '../src/game/stats.ts';
import { buildItemGuessHints, compareItemEffects, compareItemOptions, hiddenItemFields, isCorrectItemGuess, ITEM_FIELDS, normalizeItem, normalizeSkillGroup, searchItems } from '../src/game/item.ts';
const characters = JSON.parse(readFileSync(new URL('../characters.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const rawItems = JSON.parse(readFileSync(new URL('../wordler_items.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(new Set(characters.map(c => c.id)).size, characters.length);
assert.equal(compareSet(['검', '활'], ['활', '검']), 'exact');
assert.equal(compareSet(['검', '활'], ['검']), 'partial');
assert.equal(compareSet(['검'], ['활']), 'wrong');
assert.equal(compareNumber(17, 26), 'higher');
assert.equal(compareNumber(190, 160), 'lower');
assert.equal(compareNumber(null, 20), 'wrong');
const random = Math.random;
Math.random = () => 0;
assert.equal(compareNumber(20, null), 'higher');
Math.random = () => 1;
assert.equal(compareNumber(20, null), 'lower');
Math.random = random;
assert.equal(compareNumber(null, null), 'exact');
assert.equal(compareRisk('C', 'A'), 'higher');
assert.equal(compareRisk('B', 'D'), 'lower');
assert.equal(buildGuessHints({ ...characters[0], risk: 'C' }, { ...characters[1], risk: 'A' }, 'coward').risk.status, 'higher');
for (const character of characters) {
  assert.ok(character.roles.length && character.weapons.length && /^[A-E]$/.test(character.risk));
  assert.ok(Object.values(buildGuessHints(character, character)).every(hint => hint.status === 'exact'));
  assert.ok(isCorrectGuess(character, character));
}
assert.equal(isCorrectGuess(characters[0], characters[1]), false);
for (let i = 0; i < 50; i++) {
  const fields = randomFields(2);
  assert.equal(fields.length, 2);
  assert.equal(new Set(fields).size, 2);
}
assert.equal(randomFields(99).length, 5);
assert.equal(hiddenFields('classic', 0, 'roles').length, 0);
assert.equal(hiddenFields('sealed', 0, 'roles').length, 2);
assert.equal(hiddenFields('fog', 0, 'roles').length, 4);
assert.equal(hiddenFields('fog', 1, 'roles').length, 3);
assert.equal(hiddenFields('fog', 4, 'roles').length, 0);
const characterRevealOrder = ['age', 'weapons', 'risk', 'roles', 'height'];
const characterRevealed = characterRevealOrder.map((_, turn) => new Set(characterRevealOrder.filter(field => !hiddenFields('fog', turn, 'roles', characterRevealOrder).includes(field))));
for (let turn = 1; turn < characterRevealed.length; turn++) {
  assert.ok([...characterRevealed[turn - 1]].every(field => characterRevealed[turn].has(field)));
  assert.equal(characterRevealed[turn].size, characterRevealed[turn - 1].size + 1);
}
assert.deepEqual(hiddenFields('single', 0, 'roles'), ['weapons', 'age', 'height', 'risk']);
assert.deepEqual(hiddenFields('single', 3, 'roles'), ['weapons', 'age', 'height', 'risk']);
assert.deepEqual(hiddenFields('manly', 0, 'roles'), ['weapons', 'age', 'height', 'risk']);
assert.equal(maxGuessesForMode('manly'), 3);
assert.equal(maxGuessesForMode('taboo'), 7);
assert.equal(maxGuessesForMode('reverse'), 5);
assert.equal(maxGuessesForMode('relay'), 5);
for (let turn = 0; turn < 7; turn++) assert.deepEqual(hiddenFields('taboo', turn, 'age'), ['age']);
for (let turn = 0; turn < 5; turn++) {
  assert.deepEqual(hiddenFields('reverse', turn, 'age', characterRevealOrder), characterRevealOrder.slice(0, turn));
}
assert.equal(guessStatus('taboo', false, 6, 1), 'playing');
assert.equal(guessStatus('taboo', false, 7, 1), 'lost');
assert.equal(guessStatus('taboo', true, 7, 1), 'won');
for (let round = 1; round <= RELAY_ROUNDS; round++) {
  assert.equal(guessStatus('relay', false, 4, round), 'playing');
  assert.equal(guessStatus('relay', false, 5, round), 'lost');
  assert.equal(guessStatus('relay', true, 5, round), round === RELAY_ROUNDS ? 'won' : 'round-won');
}
console.log(`Passed comparison and dataset checks for ${characters.length} characters.`);

assert.equal(searchCharacters(characters, 'ㅈㅋ')[0].id, 'Jackie');
assert.equal(searchCharacters(characters, ' JACKIE ')[0].id, 'Jackie');
assert.equal(searchCharacters(characters, '리다이린')[0].id, 'LiDailin');
assert.equal(searchCharacters(characters, '재키'.normalize('NFD'))[0].id, 'Jackie');
assert.equal(searchCharacters(characters, '재ㅋ')[0].id, 'Jackie');
assert.equal(searchCharacters(characters, 'wozl')[0].id, 'Jackie');
assert.equal(searchCharacters(characters, 'worzl')[0].id, 'Jackie');
assert.deepEqual(searchCharacters(characters, '존재하지않음'), []);
assert.deepEqual(searchCharacters(characters, '  '), []);
const searchPool = [
  { ...characters[0], id: 'Long', name: '가나다' },
  { ...characters[0], id: 'Exact', name: '가나' },
];
assert.equal(searchCharacters(searchPool, '가나')[0].id, 'Exact');
console.log('Passed Korean, initials, English, and exact-match search checks.');

let stats = applyGameResult(emptyStats(), true, 3);
stats = applyGameResult(stats, true, 1);
stats = applyGameResult(stats, false, 5);
assert.equal(stats.played, 3);
assert.equal(stats.wins, 2);
assert.equal(stats.currentStreak, 0);
assert.equal(stats.maxStreak, 2);
assert.deepEqual(stats.distribution, [1, 0, 1, 0, 0, 0, 0, 0, 0, 0]);
console.log('Passed local game statistics checks.');

const storedValues = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: key => storedValues.get(key) ?? null,
  setItem: (key, value) => storedValues.set(key, String(value)),
  removeItem: key => storedValues.delete(key),
  clear: () => storedValues.clear(),
  key: index => [...storedValues.keys()][index] ?? null,
  get length() { return storedValues.size; },
} });
localStorage.clear();
recordGame('character', true, 2);
assert.equal(loadStats('character').played, 1);
assert.equal(loadStats('item').played, 0);
recordGame('item', true, 1);
recordGame('character', false, 5);
assert.equal(loadStats('item').currentStreak, 1);
recordGame('item', false, 5);
assert.equal(loadStats('character').currentStreak, 0);
clearStats('character');
assert.equal(loadStats('character').played, 0);
assert.equal(loadStats('item').played, 2);
localStorage.setItem(getStatsStorageKey('character'), '{"played":"3","wins":null,"currentStreak":-1,"maxStreak":1.5,"distribution":[2,-1,"4",null,1]}');
const sanitizedStats = loadStats('character');
assert.deepEqual([sanitizedStats.played, sanitizedStats.wins, sanitizedStats.currentStreak, sanitizedStats.maxStreak], [0, 0, 0, 0]);
assert.equal(sanitizedStats.distribution.length, 10);
assert.deepEqual(sanitizedStats.distribution.slice(0, 5), [2, 0, 0, 0, 1]);
console.log('Passed separated and sanitized stored statistics checks.');

clearStats('character');
const workingStorage = localStorage;
recordGame('character', true, 1);
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: workingStorage.getItem,
  setItem: () => { throw new Error('QuotaExceededError'); },
  removeItem: () => { throw new Error('SecurityError'); },
} });
recordGame('character', true, 2);
let fallbackStats = recordGame('character', true, 3);
assert.equal(fallbackStats.played, 3);
assert.equal(fallbackStats.currentStreak, 3);
assert.deepEqual(fallbackStats.distribution.slice(0, 3), [1, 1, 1]);
assert.equal(loadStats('item').played, 2);
Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError'); } });
assert.equal(loadStats('item').played, 2);
assert.equal(recordGame('character', false, 5).played, 4);
clearStats('character');
assert.equal(loadStats('character').played, 0);
assert.equal(recordGame('character', true, 2).played, 1);
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: workingStorage });
fallbackStats = recordGame('character', true, 3);
assert.equal(fallbackStats.played, 2);
assert.equal(JSON.parse(workingStorage.getItem(getStatsStorageKey('character'))).played, 2);
workingStorage.setItem(getStatsStorageKey('character'), JSON.stringify(emptyStats()));
assert.equal(loadStats('character').played, 0);
console.log('Passed storage failure, recovery, and external update checks.');

clearStats('character');
clearStats('item');
recordGame('character', true, 2);
assert.equal(loadStats('character', 'classic').played, 0);
recordGame('character', true, 3, 'classic');
recordGame('character', false, 3, 'manly');
recordGame('character', true, 8, 'coward');
recordGame('item', true, 1, 'classic');
assert.equal(loadStats('character').played, 4);
assert.equal(loadStats('character', 'classic').currentStreak, 1);
assert.equal(loadStats('character', 'classic').distribution[2], 1);
assert.equal(loadStats('character', 'manly').wins, 0);
assert.equal(loadStats('character', 'manly').played, 1);
assert.equal(loadStats('character', 'coward').distribution[7], 1);
assert.equal(loadStats('item', 'classic').distribution[0], 1);
clearStats('character');
assert.equal(loadStats('character').played, 0);
assert.equal(loadStats('character', 'classic').played, 0);
assert.equal(loadStats('character', 'manly').played, 0);
assert.equal(loadStats('character', 'coward').played, 0);
assert.equal(loadStats('item', 'classic').played, 1);
console.log('Passed legacy totals, mode statistics, and deletion checks.');
clearStats('character');
recordGame('character', false, 9, 'relay', 1);
assert.equal(loadStats('character', 'relay').bestCleared, 1);
recordGame('character', true, 15, 'relay', 3);
assert.equal(loadStats('character', 'relay').played, 2);
assert.equal(loadStats('character', 'relay').wins, 1);
assert.equal(loadStats('character', 'relay').bestCleared, 3);
assert.equal(loadStats('character', 'relay').distribution[14], 1);
assert.equal(loadStats('character').distribution[14], 1);
recordGame('character', true, 2, 'classic');
assert.equal(loadStats('character').distribution[14], 1);
clearStats('character');
assert.equal(loadStats('character', 'relay').bestCleared, 0);
assert.equal(loadStats('character', 'relay').played, 0);

assert.equal(rawItems.length, 477);
for (const code of [102504, 108506, 130504, 202531]) {
  assert.equal(rawItems.find(item => item.code === code)?.image, `/item-images/${code}.png`);
}
const item = overrides => normalizeItem({
  code: 1, name: '테스트', englishName: 'Test', itemType: 'Weapon', subType: 'Bow', grade: 'Epic',
  statTags: [], searchTags: ['Main_Attack'], itemSkillGroups: [], itemSkills: [], image: '/item-images/1.png',
  ...overrides,
});
const answerItem = item({ code: 10, name: '정답', subType: 'Bow', grade: 'Legend', searchTags: ['Main_Attack', 'Sub1_AttackSpeed', 'Sub1_Critical'], itemSkillGroups: ['열정'] });
assert.equal(buildItemGuessHints(item({ subType: 'Bow' }), answerItem).category.status, 'exact');
assert.equal(buildItemGuessHints(item({ subType: 'Bat' }), answerItem).category.status, 'partial');
assert.equal(buildItemGuessHints(item({ itemType: 'Armor', subType: 'Head' }), answerItem).category.status, 'wrong');
assert.equal(buildItemGuessHints(item({ grade: 'Legend' }), answerItem).grade.status, 'exact');
assert.equal(buildItemGuessHints(item({ grade: 'Epic' }), answerItem).grade.status, 'higher');
assert.equal(buildItemGuessHints(item({ grade: 'Mythic' }), answerItem).grade.status, 'lower');
assert.equal(item({ grade: 'Mythic' }).gradeLabel, '초월');
assert.equal(buildItemGuessHints(item({ searchTags: ['Main_Attack'] }), answerItem).type.status, 'exact');
assert.equal(buildItemGuessHints(item({ searchTags: ['Main_Tank'] }), answerItem).type.status, 'wrong');
assert.equal(compareItemOptions(['A', 'B'], ['B', 'A']), 'exact');
assert.equal(compareItemOptions(['A', 'B'], ['B', 'C']), 'partial');
assert.equal(compareItemOptions(['A'], ['B']), 'wrong');
assert.equal(compareItemOptions([], []), 'exact');
assert.equal(compareItemOptions([], ['A']), 'wrong');
assert.equal(compareItemEffects([], []), 'exact');
assert.equal(compareItemEffects([], ['열정']), 'wrong');
assert.equal(compareItemEffects(['열정'], []), 'wrong');
assert.equal(compareItemEffects(['열정'], ['열정']), 'exact');
assert.equal(compareItemEffects(['열정'], ['저주']), 'wrong');
assert.equal(compareItemEffects(['A'], ['A', 'B']), 'partial');
assert.equal(compareItemEffects(['A', 'B'], ['B', 'A']), 'exact');
assert.equal(normalizeSkillGroup('의념[데스애더]'), '의념');
assert.equal(normalizeSkillGroup('예열 - 증강'), '예열 - 증강');
assert.ok(isCorrectItemGuess(item({ code: 7 }), item({ code: 7 })));
assert.equal(isCorrectItemGuess(item({ code: 7 }), item({ code: 8 })), false);
const sameProfileGuess = item({ code: 11, name: '다른 아이템', subType: answerItem.subType, grade: answerItem.grade, searchTags: answerItem.searchTags, itemSkillGroups: answerItem.itemSkillGroups });
assert.ok(Object.values(buildItemGuessHints(sameProfileGuess, answerItem)).every(hint => hint.status === 'exact'));
assert.equal(isCorrectItemGuess(sameProfileGuess, answerItem), false);
const freeGuess = { sameProfile: true, hiddenFields: [] };
assert.equal(itemGuessCost(freeGuess), 0);
assert.equal(itemGuessCost({ sameProfile: false, hiddenFields: [] }), 1);
assert.equal(itemGuessCost({ sameProfile: true, hiddenFields: ['grade'] }), 1);
assert.equal(4 + itemGuessCost(freeGuess), 4);
assert.equal(4 + itemGuessCost(freeGuess) + itemGuessCost({ sameProfile: false, hiddenFields: [] }), 5);
assert.equal(hiddenItemFields('classic', 0, 'category').length, 0);
assert.equal(hiddenItemFields('sealed', 0, 'category').length, 2);
assert.equal(hiddenItemFields('fog', 0, 'category').length, 4);
assert.equal(hiddenItemFields('fog', 4, 'category').length, 0);
const itemRevealOrder = ['grade', 'options', 'category', 'uniqueEffect', 'type'];
for (let turn = 0; turn < 7; turn++) assert.deepEqual(hiddenItemFields('taboo', turn, 'grade'), ['grade']);
for (let turn = 0; turn < 5; turn++) {
  assert.deepEqual(hiddenItemFields('reverse', turn, 'grade', itemRevealOrder), itemRevealOrder.slice(0, turn));
}
const itemRevealed = itemRevealOrder.map((_, turn) => new Set(itemRevealOrder.filter(field => !hiddenItemFields('fog', turn, 'category', itemRevealOrder).includes(field))));
for (let turn = 1; turn < itemRevealed.length; turn++) {
  assert.ok([...itemRevealed[turn - 1]].every(field => itemRevealed[turn].has(field)));
  assert.equal(itemRevealed[turn].size, itemRevealed[turn - 1].size + 1);
}
assert.equal(itemRevealed.at(-1).size, ITEM_FIELDS.length);
assert.deepEqual(hiddenItemFields('single', 0, 'category'), ['grade', 'type', 'options', 'uniqueEffect']);
assert.deepEqual(hiddenItemFields('manly', 0, 'category'), ['grade', 'type', 'options', 'uniqueEffect']);
const normalizedItems = rawItems.map(normalizeItem);
const isol = characters.find(character => character.id === 'Isol');
assert.equal(isol.age, 16);
const henry = characters.find(character => character.id === 'Henry');
assert.equal(henry.age, null);
assert.ok(['higher', 'lower'].includes(buildGuessHints(characters[0], henry).age.status));
const namedItem = name => normalizedItems.find(item => item.name === name);
const jinEunDress = namedItem('진은 드레스');
assert.deepEqual(namedItem('검은 베일').optionLabels, ['쿨다운 감소', '기동성']);
assert.deepEqual(namedItem('레이싱 헬멧').optionLabels, ['공격 속도', '쿨다운 감소']);
assert.deepEqual(namedItem('백야의 관').optionLabels, ['쿨다운 감소']);
assert.deepEqual(namedItem('엘프 드레스').optionLabels, ['쿨다운 감소']);
assert.deepEqual(namedItem('오니 가면').optionLabels, ['공격 속도', '최대 체력']);
assert.deepEqual(namedItem('와일드 워커').optionLabels, ['쿨다운 감소', '방어']);
assert.deepEqual(namedItem('롤리팝').optionLabels, ['최대 체력']);
assert.deepEqual(namedItem('블루3').optionLabels, ['치명타']);
assert.deepEqual([namedItem('에스프리').mainTypeLabel, ...namedItem('에스프리').optionLabels], ['스킬']);
assert.deepEqual(namedItem('윈드러너').optionLabels, ['방어']);
assert.deepEqual(namedItem('운명의 고리').optionLabels, ['최대 체력']);
assert.deepEqual(namedItem('은둔자').optionLabels, ['스킬 증폭']);
assert.deepEqual(namedItem('더 문').optionLabels, ['스킬 증폭']);
assert.deepEqual(namedItem('더 데스-진홍').optionLabels, ['방어 관통']);
assert.deepEqual(namedItem('큐브 워치').optionLabels, ['공격 속도', '쿨다운 감소', '치명타']);
assert.equal(buildItemGuessHints(namedItem('칼날 다리'), jinEunDress).options.status, 'exact');
assert.equal(buildItemGuessHints(namedItem('에메랄드 타블렛'), jinEunDress).options.status, 'partial');
assert.equal(buildItemGuessHints(namedItem('위도우 메이커'), jinEunDress).options.status, 'partial');
assert.equal(buildItemGuessHints(namedItem('엘프 드레스'), jinEunDress).options.status, 'partial');
assert.equal(buildItemGuessHints(namedItem('레이싱 헬멧'), jinEunDress).options.status, 'partial');
const fieldThorn = normalizedItems.find(item => item.code === 120504);
assert.ok(fieldThorn);
assert.deepEqual([fieldThorn.name, fieldThorn.englishName, fieldThorn.categoryLabel, fieldThorn.gradeLabel, fieldThorn.mainTypeLabel, fieldThorn.effectGroups[0]], ['필드 쏜', 'Field Thorn', '무기 · 레이피어', '전설', '스킬', '신속']);
assert.equal(searchItems(normalizedItems, 'ㅍㄷㅆ')[0].code, 120504);
const chillwindCuirass = rawItems.find(item => item.code === 202531);
assert.equal(searchItems(normalizedItems, 'ㅅㄼㄹ')[0].code, chillwindCuirass.code);
assert.equal(searchItems(normalizedItems, 'tfqf')[0].code, chillwindCuirass.code);
assert.equal(searchItems(normalizedItems, 'tjflqkfka')[0].code, chillwindCuirass.code);
assert.equal(searchItems(normalizedItems, '노스페라투 새벽')[0].name, '노스페라투-새벽');
assert.equal(searchItems(normalizedItems, String(rawItems[0].code))[0].code, rawItems[0].code);
assert.equal(searchItems(normalizedItems, rawItems[0].englishName)[0].code, rawItems[0].code);
assert.equal(searchItems(normalizedItems, 'ㄱㄱㅂ')[0].code, rawItems[0].code);
assert.equal(searchItems(normalizedItems, 'rndrlqud')[0].code, rawItems[0].code);
console.log(`Passed item comparison, mode, search, and dataset checks for ${rawItems.length} items.`);
