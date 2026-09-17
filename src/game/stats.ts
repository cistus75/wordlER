import { safeStorageGet, safeStorageRemove, safeStorageSet } from './storage.ts';
import type { GameMode } from '../types';
import { GAME_MODES } from './ui.ts';
import { MAX_GUESSES, RELAY_ROUNDS } from './rules.ts';

export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  bestCleared: number;
}

export type GameKind = 'character' | 'item';

const STORAGE_KEYS: Record<GameKind, string> = {
  character: 'wordler:stats:character:v1',
  item: 'wordler:stats:item:v1',
};
export const DISTRIBUTION_SIZE = 10;

export function getStatsStorageKey(kind: GameKind, mode?: GameMode): string {
  return mode ? `${STORAGE_KEYS[kind]}:${mode}` : STORAGE_KEYS[kind];
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0 ? value : 0;
}

export function emptyStats(size = DISTRIBUTION_SIZE): GameStats {
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: Array(size).fill(0), bestCleared: 0 };
}

export function applyGameResult(stats: GameStats, won: boolean, attempts: number, cleared = 0): GameStats {
  const currentStreak = won ? stats.currentStreak + 1 : 0;
  const size = won && attempts > DISTRIBUTION_SIZE ? RELAY_ROUNDS * MAX_GUESSES : stats.distribution.length;
  const distribution = Array.from({ length: Math.max(size, stats.distribution.length) }, (_, index) => stats.distribution[index] ?? 0);
  if (won && attempts >= 1 && attempts <= distribution.length) distribution[attempts - 1]++;
  return {
    played: stats.played + 1,
    wins: stats.wins + Number(won),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    bestCleared: Math.max(stats.bestCleared, Math.min(RELAY_ROUNDS, cleared)),
  };
}

export function loadStats(kind: GameKind, mode?: GameMode): GameStats {
  const size = mode === 'relay' ? RELAY_ROUNDS * MAX_GUESSES : DISTRIBUTION_SIZE;
  try {
    const stored: unknown = JSON.parse(safeStorageGet(getStatsStorageKey(kind, mode)) ?? 'null');
    if (!stored || typeof stored !== 'object') return emptyStats(size);
    const value = stored as Record<string, unknown>;
    const distribution = Array.isArray(value.distribution) ? value.distribution : [];
    return {
      played: nonNegativeInteger(value.played),
      wins: nonNegativeInteger(value.wins),
      currentStreak: nonNegativeInteger(value.currentStreak),
      maxStreak: nonNegativeInteger(value.maxStreak),
      distribution: Array.from({ length: Math.max(size, Math.min(distribution.length, RELAY_ROUNDS * MAX_GUESSES)) }, (_, index) => nonNegativeInteger(distribution[index])),
      bestCleared: Math.min(RELAY_ROUNDS, nonNegativeInteger(value.bestCleared)),
    };
  } catch {
    return emptyStats(size);
  }
}

export function recordGame(kind: GameKind, won: boolean, attempts: number, mode?: GameMode, cleared = 0): GameStats {
  const next = applyGameResult(loadStats(kind), won, attempts, cleared);
  safeStorageSet(STORAGE_KEYS[kind], JSON.stringify(next));
  if (mode) {
    const modeStats = applyGameResult(loadStats(kind, mode), won, attempts, cleared);
    safeStorageSet(getStatsStorageKey(kind, mode), JSON.stringify(modeStats));
  }
  return next;
}

export function clearStats(kind: GameKind): GameStats {
  safeStorageRemove(STORAGE_KEYS[kind]);
  for (const mode of GAME_MODES) safeStorageRemove(getStatsStorageKey(kind, mode.id));
  return emptyStats();
}
