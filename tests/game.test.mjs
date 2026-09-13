import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchCharacters } from '../src/game/search.ts';
import { buildGuessHints, compareNumber, compareRisk, compareSet, hiddenFields, isCorrectGuess, randomFields } from '../src/game/compare.ts';
import { applyGameResult, emptyStats } from '../src/game/stats.ts';
const characters = JSON.parse(readFileSync(new URL('../characters.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(new Set(characters.map(c => c.id)).size, characters.length);
assert.equal(compareSet(['검', '활'], ['활', '검']), 'exact');
assert.equal(compareSet(['검', '활'], ['검']), 'partial');
assert.equal(compareSet(['검'], ['활']), 'wrong');
assert.equal(compareNumber(17, 26), 'higher');
assert.equal(compareNumber(190, 160), 'lower');
assert.equal(compareNumber(null, 20), 'wrong');
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
assert.deepEqual(hiddenFields('single', 0, 'roles'), ['weapons', 'age', 'height', 'risk']);
assert.deepEqual(hiddenFields('single', 3, 'roles'), ['weapons', 'age', 'height', 'risk']);
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
