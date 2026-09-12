import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchCharacters } from '../src/game/search.ts';
import { buildGuessHints, compareNumber, compareSet, isCorrectGuess } from '../src/game/compare.ts';
const characters = JSON.parse(readFileSync(new URL('../characters.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(new Set(characters.map(c => c.id)).size, characters.length);
assert.equal(compareSet(['검', '활'], ['활', '검']), 'exact');
assert.equal(compareSet(['검', '활'], ['검']), 'partial');
assert.equal(compareSet(['검'], ['활']), 'wrong');
assert.equal(compareNumber(17, 26), 'higher');
assert.equal(compareNumber(190, 160), 'lower');
assert.equal(compareNumber(null, 20), 'wrong');
assert.equal(compareNumber(null, null), 'exact');
for (const character of characters) {
  assert.ok(character.roles.length && character.weapons.length && /^[A-E]$/.test(character.risk));
  assert.ok(Object.values(buildGuessHints(character, character)).every(hint => hint.status === 'exact'));
  assert.ok(isCorrectGuess(character, character));
}
assert.equal(isCorrectGuess(characters[0], characters[1]), false);
console.log(`Passed comparison and dataset checks for ${characters.length} characters.`);

assert.equal(searchCharacters(characters, 'ㅈㅋ')[0].id, 'Jackie');
assert.equal(searchCharacters(characters, ' JACKIE ')[0].id, 'Jackie');
assert.equal(searchCharacters(characters, '리다이린')[0].id, 'LiDailin');
assert.equal(searchCharacters(characters, '재키'.normalize('NFD'))[0].id, 'Jackie');
assert.deepEqual(searchCharacters(characters, '존재하지않음'), []);
assert.deepEqual(searchCharacters(characters, '  '), []);
const searchPool = [
  { ...characters[0], id: 'Long', name: '가나다' },
  { ...characters[0], id: 'Exact', name: '가나' },
];
assert.equal(searchCharacters(searchPool, '가나')[0].id, 'Exact');
console.log('Passed Korean, initials, English, and exact-match search checks.');
