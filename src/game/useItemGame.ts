import { useMemo, useState } from 'react';
import type { GameMode, GameStatus, ItemField, ItemGuessResult, NormalizedItem } from '../types';
import { buildItemGuessHints, hiddenItemFields, isCorrectItemGuess, itemGuessCost, shuffledItemFields, ITEM_FIELDS } from './item';
import { guessStatus, maxGuessesForMode, plantLie } from './rules';

function randomItem(items: NormalizedItem[], excludedCodes: number[] = []): NormalizedItem | null {
  const candidates = items.filter(item => !excludedCodes.includes(item.code));
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function useItemGame(items: NormalizedItem[]) {
  const [mode, setModeState] = useState<GameMode>('classic');
  const [answer, setAnswer] = useState(() => randomItem(items));
  const [guesses, setGuesses] = useState<ItemGuessResult[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [solved, setSolved] = useState<number[]>([]);
  const [previousAttempts, setPreviousAttempts] = useState(0);
  const round = solved.length + 1;
  const [singleField, setSingleField] = useState<ItemField>(() => shuffledItemFields()[0]);
  const [revealOrder, setRevealOrder] = useState<ItemField[]>(shuffledItemFields);
  const guessedCodes = useMemo(() => new Set(guesses.map(result => result.item.code)), [guesses]);
  const maxGuesses = maxGuessesForMode(mode);
  const attempts = guesses.reduce((total, guess) => total + itemGuessCost(guess), 0);

  function reset(nextMode: GameMode = mode) {
    setAnswer(randomItem(items, items.length > 1 && answer ? [answer.code] : []));
    setGuesses([]);
    setStatus('playing');
    setModeState(nextMode);
    setSingleField(shuffledItemFields()[0]);
    setRevealOrder(shuffledItemFields());
    setSolved([]);
    setPreviousAttempts(0);
  }

  function advance() {
    if (status !== 'round-won' || !answer) return;
    const nextSolved = [...solved, answer.code];
    setAnswer(randomItem(items, nextSolved));
    setSolved(nextSolved);
    setPreviousAttempts(previousAttempts + attempts);
    setGuesses([]);
    setStatus('playing');
  }

  function setMode(nextMode: GameMode) {
    if (nextMode !== mode) reset(nextMode);
  }

  function submitGuess(item: NormalizedItem): ItemGuessResult | null {
    if (!answer || status !== 'playing' || guessedCodes.has(item.code)) return null;
    const hints = buildItemGuessHints(item, answer);
    const correct = isCorrectItemGuess(item, answer);
    const result: ItemGuessResult = { item, ...(mode === 'liar' ? plantLie(hints, ITEM_FIELDS, correct) : { hints }), hiddenFields: hiddenItemFields(mode, attempts, singleField, revealOrder), sameProfile: !correct && Object.values(hints).every(hint => hint.status === 'exact') };
    setGuesses([...guesses, result]);
    setStatus(guessStatus(mode, correct, attempts + itemGuessCost(result), round));
    return result;
  }

  return { answer, guesses, guessedCodes, mode, status, maxGuesses, attempts, round, previousAttempts, singleField, submitGuess, reset, advance, setMode };
}
