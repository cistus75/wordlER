import type { Character } from '../types';

const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

export function normalize(text: string) {
  return text.normalize('NFC').toLowerCase().replace(/\s/g, '');
}

export function searchCharacters(characters: Character[], query: string): Character[] {
  const value = normalize(query);
  if (!value) return [];

  return characters.map(character => {
    const name = normalize(character.name);
    const id = normalize(character.id);
    const first = [...name].map(letter => {
      const code = letter.charCodeAt(0) - 44032;
      return code >= 0 && code <= 11171 ? initials[Math.floor(code / 588)] : letter;
    }).join('');
    const rank = name === value || id === value ? 0
      : name.startsWith(value) || id.startsWith(value) ? 1
      : name.includes(value) || id.includes(value) ? 2
      : first.startsWith(value) ? 3 : first.includes(value) ? 4 : -1;
    return { character, rank };
  }).filter(item => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.character.name.localeCompare(b.character.name, 'ko'))
    .map(item => item.character);
}

