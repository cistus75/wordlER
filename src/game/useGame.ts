import { useMemo, useState } from 'react';
import type { Character, ComparableField, GameMode, GameStatus, GuessResult } from '../types.ts';
import { buildGuessHints, COMPARABLE_FIELDS, hiddenFields, isCorrectGuess, randomFields } from './compare.ts';
import { guessStatus, maxGuessesForMode } from './rules.ts';

function randomCharacter(characters: Character[], excludedIds: string[] = []): Character | null {
  const candidates = characters.filter(character => !excludedIds.includes(character.id));
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
export function useGame(characters: Character[]) {
  const [mode, setModeState] = useState<GameMode>('classic');
  const [answer, setAnswer] = useState(() => randomCharacter(characters));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [solved, setSolved] = useState<string[]>([]);
  const [previousAttempts, setPreviousAttempts] = useState(0);
  const round = solved.length + 1;
  const [singleField, setSingleField] = useState<ComparableField>(() => randomFields(1)[0]);
  const [revealOrder, setRevealOrder] = useState<ComparableField[]>(() => randomFields(COMPARABLE_FIELDS.length));
  const guessedIds = useMemo(() => new Set(guesses.map(result => result.character.id)), [guesses]);
  const maxGuesses = maxGuessesForMode(mode);
  function reset(nextMode: GameMode = mode) {
    setAnswer(randomCharacter(characters, characters.length > 1 && answer ? [answer.id] : []));
    setGuesses([]);
    setStatus('playing');
    setModeState(nextMode);
    setSingleField(randomFields(1)[0]);
    setRevealOrder(randomFields(COMPARABLE_FIELDS.length));
    setSolved([]);
    setPreviousAttempts(0);
  }
  function advance() {
    if (status !== 'round-won' || !answer) return;
    const nextSolved = [...solved, answer.id];
    setAnswer(randomCharacter(characters, nextSolved));
    setSolved(nextSolved);
    setPreviousAttempts(previousAttempts + guesses.length);
    setGuesses([]);
    setStatus('playing');
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
    setStatus(guessStatus(mode, isCorrectGuess(character, answer), guesses.length + 1, round));
    return result;
  }
  return { answer, guesses, guessedIds, mode, status, maxGuesses, round, previousAttempts, singleField, submitGuess, reset, advance, setMode };
}
