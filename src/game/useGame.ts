import { useMemo, useState } from 'react';
import type { Character, ComparableField, GameMode, GameStatus, GuessResult } from '../types';
import { buildGuessHints, hiddenFields, isCorrectGuess, randomFields } from './compare';

export const MAX_GUESSES = 5;
function randomCharacter(characters: Character[], previousId?: string): Character | null {
  const candidates = characters.length > 1 ? characters.filter(character => character.id !== previousId) : characters;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
export function useGame(characters: Character[]) {
  const [mode, setModeState] = useState<GameMode>('classic');
  const [answer, setAnswer] = useState(() => randomCharacter(characters));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [singleField, setSingleField] = useState<ComparableField>(() => randomFields(1)[0]);
  const guessedIds = useMemo(() => new Set(guesses.map(result => result.character.id)), [guesses]);
  function reset(nextMode: GameMode = mode) {
    setAnswer(current => randomCharacter(characters, current?.id));
    setGuesses([]);
    setStatus('playing');
    setModeState(nextMode);
    setSingleField(randomFields(1)[0]);
  }
  function setMode(nextMode: GameMode) {
    if (nextMode !== mode) reset(nextMode);
  }
  function submitGuess(character: Character): GuessResult | null {
    if (!answer || status !== 'playing' || guessedIds.has(character.id)) return null;
    const result = {
      character,
      hints: buildGuessHints(character, answer),
      hiddenFields: hiddenFields(mode, guesses.length, singleField),
    };
    setGuesses([...guesses, result]);
    if (isCorrectGuess(character, answer)) setStatus('won');
    else if (guesses.length + 1 >= MAX_GUESSES) setStatus('lost');
    return result;
  }
  return { answer, guesses, guessedIds, mode, status, submitGuess, reset, setMode };
}
