import type { Character } from '../types';

export const SEARCH_QUERY_MAX_LENGTH = 100;

const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
const finals = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const compoundJamo = new Map(Object.entries({ ㄳ: 'ㄱㅅ', ㄵ: 'ㄴㅈ', ㄶ: 'ㄴㅎ', ㄺ: 'ㄹㄱ', ㄻ: 'ㄹㅁ', ㄼ: 'ㄹㅂ', ㄽ: 'ㄹㅅ', ㄾ: 'ㄹㅌ', ㄿ: 'ㄹㅍ', ㅀ: 'ㄹㅎ', ㅄ: 'ㅂㅅ' }));
const keyboard = new Map(Object.entries({
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
  Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
}));

export function normalize(text: string) {
  return text.normalize('NFC').toLowerCase().replace(/[\s\p{P}]/gu, '');
}

function toJamo(text: string) {
  return [...text].map(letter => {
    const code = letter.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return letter;
    return initials[Math.floor(code / 588)] + medials[Math.floor((code % 588) / 28)] + finals[code % 28];
  }).join('');
}

function keyboardToJamo(text: string) {
  return [...text].map(letter => keyboard.get(letter) ?? keyboard.get(letter.toLowerCase()) ?? letter).join('');
}

function expandCompoundJamo(text: string) {
  return [...text].map(letter => compoundJamo.get(letter) ?? letter).join('');
}

function isWithinOneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let left = 0;
  let right = 0;
  let edits = 0;
  while (left < a.length && right < b.length) {
    if (a[left] === b[right]) {
      left++;
      right++;
    } else {
      if (++edits > 1) return false;
      if (a.length >= b.length) left++;
      if (b.length >= a.length) right++;
    }
  }
  return edits + Number(left < a.length || right < b.length) <= 1;
}

export function searchEntries<T>(entries: T[], query: string, aliases: (entry: T) => string[]): T[] {
  const value = normalize(query);
  if (!value) return [];
  const valueJamo = toJamo(value);
  const typedAsEnglish = /^[a-z]+$/.test(value);
  const keyboardJamo = typedAsEnglish ? normalize(keyboardToJamo(query)) : '';
  const initialValue = expandCompoundJamo(value);

  return entries.map(entry => {
    const names = aliases(entry).map(normalize);
    const name = names[0];
    const nameJamo = toJamo(name);
    const first = [...name].map(letter => {
      const code = letter.charCodeAt(0) - 44032;
      return code >= 0 && code <= 11171 ? initials[Math.floor(code / 588)] : letter;
    }).join('');
    const rank = names.some(candidate => candidate === value) ? 0
      : names.some(candidate => candidate.startsWith(value)) ? 1
      : names.some(candidate => candidate.includes(value)) ? 2
      : first.startsWith(initialValue) ? 3 : first.includes(initialValue) ? 4 : -1;
    const jamoRank = nameJamo === valueJamo ? 0
      : nameJamo.startsWith(valueJamo) ? 1
      : nameJamo.includes(valueJamo) ? 2 : -1;
    const keyboardRank = keyboardJamo && nameJamo === keyboardJamo ? 0
      : keyboardJamo && nameJamo.startsWith(keyboardJamo) ? 1
      : keyboardJamo && nameJamo.includes(keyboardJamo) ? 2
      : keyboardJamo && first.startsWith(keyboardJamo) ? 3
      : keyboardJamo && first.includes(keyboardJamo) ? 4
      : typedAsEnglish && value.length >= 4 && isWithinOneEdit(nameJamo, keyboardJamo) ? 3 : -1;
    const koreanRank = Math.min(
      jamoRank < 0 ? Infinity : jamoRank + 3,
      keyboardRank < 0 ? Infinity : keyboardRank + 1,
    );
    const bestRank = Math.min(rank < 0 ? Infinity : rank, koreanRank);
    return { entry, rank: Number.isFinite(bestRank) ? bestRank : -1 };
  }).filter(item => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank || aliases(a.entry)[0].localeCompare(aliases(b.entry)[0], 'ko'))
    .map(item => item.entry);
}

export function searchCharacters(characters: Character[], query: string): Character[] {
  return searchEntries(characters, query, character => [character.name, character.id]);
}

