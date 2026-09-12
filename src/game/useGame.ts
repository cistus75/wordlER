import { useMemo, useState } from 'react';
import type { Character, GameStatus, GuessResult } from '../types';
import { buildGuessHints, isCorrectGuess } from './compare';

export const MAX_GUESSES = 5;
function randomCharacter(characters: Character[], previousId?: string): Character | null {
  const candidates = characters.length > 1 ? characters.filter(character => character.id !== previousId) : characters;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
export function useGame(characters: Character[]) {
  const [answer, setAnswer] = useState(() => randomCharacter(characters));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const guessedIds = useMemo(() => new Set(guesses.map(result => result.character.id)), [guesses]);
  function reset() {
    setAnswer(current => randomCharacter(characters, current?.id));
    setGuesses([]);
    setStatus('playing');
  }
  function submitGuess(character: Character): GuessResult | null {
    if (!answer || status !== 'playing' || guessedIds.has(character.id)) return null;
    const result = { character, hints: buildGuessHints(character, answer) };
    setGuesses([...guesses, result]);
    if (isCorrectGuess(character, answer)) setStatus('won');
    else if (guesses.length + 1 >= MAX_GUESSES) setStatus('lost');
    return result;
  }
  return { answer, guesses, guessedIds, status, submitGuess, reset };
}
