import { useMemo, useState } from 'react';
import type { GameMode, GameStatus, ItemField, ItemGuessResult, NormalizedItem } from '../types';
import { buildItemGuessHints, hiddenItemFields, isCorrectItemGuess, shuffledItemFields } from './item';
import { MAX_GUESSES, SUPER_COWARD_MAX_GUESSES } from './useGame';

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
  const maxGuesses = mode === 'coward' ? SUPER_COWARD_MAX_GUESSES : MAX_GUESSES;

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
    const result = { item, hints, hiddenFields: hiddenItemFields(mode, guesses.length, singleField, revealOrder), sameProfile: !correct && Object.values(hints).every(hint => hint.status === 'exact') };
    setGuesses([...guesses, result]);
    if (correct) setStatus('won');
    else if (guesses.length + 1 >= maxGuesses) setStatus('lost');
    return result;
  }

  return { answer, guesses, guessedCodes, mode, status, maxGuesses, submitGuess, reset, setMode };
}
