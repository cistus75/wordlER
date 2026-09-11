import { useCallback, useMemo, useState } from 'react';
import type { Character, GameMode, GameStatus, GuessResult } from '../types';
import {
  buildGuessHints,
  chooseHiddenFields,
  isCorrectGuess,
} from './compare';

export const MAX_GUESSES = 5;
export const CENSORED_FIELD_COUNT = 3;

function randomCharacter(characters: Character[], previousId?: string): Character | null {
  if (characters.length === 0) return null;

  const candidates =
    characters.length > 1 && previousId
      ? characters.filter((character) => character.id !== previousId)
      : characters;

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function useGame(characters: Character[]) {
  const [mode, setModeState] = useState<GameMode>('normal');
  const [answer, setAnswer] = useState<Character | null>(() => randomCharacter(characters));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');

  const guessedIds = useMemo(
    () => new Set(guesses.map((result) => result.character.id)),
    [guesses],
  );

  const remainingGuesses = MAX_GUESSES - guesses.length;

  const reset = useCallback(
    (nextMode: GameMode = mode) => {
      setAnswer((current) => randomCharacter(characters, current?.id));
      setGuesses([]);
      setStatus('playing');
      setModeState(nextMode);
    },
    [characters, mode],
  );

  const setMode = useCallback(
    (nextMode: GameMode) => {
      reset(nextMode);
    },
    [reset],
  );

  const submitGuess = useCallback(
    (character: Character): GuessResult | null => {
      if (!answer || status !== 'playing' || guessedIds.has(character.id)) return null;

      const result: GuessResult = {
        character,
        hints: buildGuessHints(character, answer),
        hiddenFields: mode === 'censored' ? chooseHiddenFields(CENSORED_FIELD_COUNT) : [],
      };

      const nextGuesses = [...guesses, result];
      setGuesses(nextGuesses);

      if (isCorrectGuess(character, answer)) {
        setStatus('won');
      } else if (nextGuesses.length >= MAX_GUESSES) {
        setStatus('lost');
      }

      return result;
    },
    [answer, guessedIds, guesses, mode, status],
  );

  return {
    answer,
    guesses,
    guessedIds,
    mode,
    status,
    remainingGuesses,
    submitGuess,
    reset,
    setMode,
  };
}
