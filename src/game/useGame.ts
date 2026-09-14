import { useMemo, useState } from 'react';
import type { Character, ComparableField, GameMode, GameStatus, GuessResult } from '../types';
import { buildGuessHints, COMPARABLE_FIELDS, hiddenFields, isCorrectGuess, randomFields } from './compare';

export const MAX_GUESSES = 5;
export const SUPER_COWARD_MAX_GUESSES = 10;
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
  const [revealOrder, setRevealOrder] = useState<ComparableField[]>(() => randomFields(COMPARABLE_FIELDS.length));
  const guessedIds = useMemo(() => new Set(guesses.map(result => result.character.id)), [guesses]);
  const maxGuesses = mode === 'coward' ? SUPER_COWARD_MAX_GUESSES : MAX_GUESSES;
  function reset(nextMode: GameMode = mode) {
    setAnswer(current => randomCharacter(characters, current?.id));
    setGuesses([]);
    setStatus('playing');
    setModeState(nextMode);
    setSingleField(randomFields(1)[0]);
    setRevealOrder(randomFields(COMPARABLE_FIELDS.length));
  }
  function setMode(nextMode: GameMode) {
    if (nextMode !== mode) reset(nextMode);
  }
  function submitGuess(character: Character): GuessResult | null {
    if (!answer || status !== 'playing' || guessedIds.has(character.id)) return null;
    const result = {
      character,
      hints: buildGuessHints(character, answer, mode),
      hiddenFields: hiddenFields(mode, guesses.length, singleField, revealOrder),
    };
    setGuesses([...guesses, result]);
    if (isCorrectGuess(character, answer)) setStatus('won');
    else if (guesses.length + 1 >= maxGuesses) setStatus('lost');
    return result;
  }
  return { answer, guesses, guessedIds, mode, status, maxGuesses, submitGuess, reset, setMode };
}
