import type { Character } from '../types';

const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
const finals = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const keyboard = new Map(Object.entries({
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
}));

export function normalize(text: string) {
  return text.normalize('NFC').toLowerCase().replace(/\s/g, '');
}

function toJamo(text: string) {
  return [...text].map(letter => {
    const code = letter.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return letter;
    return initials[Math.floor(code / 588)] + medials[Math.floor((code % 588) / 28)] + finals[code % 28];
  }).join('');
}

function keyboardToJamo(text: string) {
  return [...text].map(letter => keyboard.get(letter) ?? letter).join('');
}

function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row++) {
    const current = [row];
    for (let column = 1; column <= b.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

export function searchCharacters(characters: Character[], query: string): Character[] {
  const value = normalize(query);
  if (!value) return [];

  return characters.map(character => {
    const name = normalize(character.name);
    const id = normalize(character.id);
    const nameJamo = toJamo(name);
    const valueJamo = toJamo(value);
    const typedAsEnglish = /^[a-z]+$/.test(value);
    const keyboardJamo = typedAsEnglish ? keyboardToJamo(value) : '';
    const first = [...name].map(letter => {
      const code = letter.charCodeAt(0) - 44032;
      return code >= 0 && code <= 11171 ? initials[Math.floor(code / 588)] : letter;
    }).join('');
    const rank = name === value || id === value ? 0
      : name.startsWith(value) || id.startsWith(value) ? 1
      : name.includes(value) || id.includes(value) ? 2
      : first.startsWith(value) ? 3 : first.includes(value) ? 4 : -1;
    const jamoRank = nameJamo === valueJamo ? 0
      : nameJamo.startsWith(valueJamo) ? 1
      : nameJamo.includes(valueJamo) ? 2 : -1;
    const keyboardRank = keyboardJamo && nameJamo === keyboardJamo ? 0
      : keyboardJamo && nameJamo.startsWith(keyboardJamo) ? 1
      : keyboardJamo && nameJamo.includes(keyboardJamo) ? 2
      : typedAsEnglish && value.length >= 4 && editDistance(nameJamo, keyboardJamo) <= 1 ? 3 : -1;
    const koreanRank = Math.min(
      jamoRank < 0 ? Infinity : jamoRank + 3,
      keyboardRank < 0 ? Infinity : keyboardRank + 3,
    );
    const bestRank = Math.min(rank < 0 ? Infinity : rank, koreanRank);
    return { character, rank: Number.isFinite(bestRank) ? bestRank : -1 };
  }).filter(item => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.character.name.localeCompare(b.character.name, 'ko'))
    .map(item => item.character);
}

