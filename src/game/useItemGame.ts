import { useMemo, useState } from 'react';
import type { GameMode, GameStatus, ItemField, ItemGuessResult, NormalizedItem } from '../types';
import { buildItemGuessHints, hiddenItemFields, isCorrectItemGuess, itemGuessCost, shuffledItemFields } from './item';
import { maxGuessesForMode } from './useGame';

function randomItem(items: NormalizedItem[], previousCode?: number): NormalizedItem | null {
  const candidates = items.length > 1 ? items.filter(item => item.code !== previousCode) : items;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function useItemGame(items: NormalizedItem[]) {
  const [mode, setModeState] = useState<GameMode>('classic');
  const [answer, setAnswer] = useState(() => randomItem(items));
  const [guesses, setGuesses] = useState<ItemGuessResult[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [singleField, setSingleField] = useState<ItemField>(() => shuffledItemFields()[0]);
  const [revealOrder, setRevealOrder] = useState<ItemField[]>(shuffledItemFields);
  const guessedCodes = useMemo(() => new Set(guesses.map(result => result.item.code)), [guesses]);
  const maxGuesses = maxGuessesForMode(mode);
  const attempts = guesses.reduce((total, guess) => total + itemGuessCost(guess), 0);

  function reset(nextMode: GameMode = mode) {
    setAnswer(current => randomItem(items, current?.code));
    setGuesses([]);
    setStatus('playing');
    setModeState(nextMode);
    setSingleField(shuffledItemFields()[0]);
    setRevealOrder(shuffledItemFields());
  }

  function setMode(nextMode: GameMode) {
    if (nextMode !== mode) reset(nextMode);
  }

  function submitGuess(item: NormalizedItem): ItemGuessResult | null {
    if (!answer || status !== 'playing' || guessedCodes.has(item.code)) return null;
    const hints = buildItemGuessHints(item, answer);
    const correct = isCorrectItemGuess(item, answer);
    const result = { item, hints, hiddenFields: hiddenItemFields(mode, attempts, singleField, revealOrder), sameProfile: !correct && Object.values(hints).every(hint => hint.status === 'exact') };
    setGuesses([...guesses, result]);
    if (correct) setStatus('won');
    else if (attempts + itemGuessCost(result) >= maxGuesses) setStatus('lost');
    return result;
  }

  return { answer, guesses, guessedCodes, mode, status, maxGuesses, attempts, submitGuess, reset, setMode };
}
