import { safeStorageGet, safeStorageRemove, safeStorageSet } from './storage.ts';
import type { GameMode } from '../types';
import { GAME_MODES } from './ui.ts';

export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
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

export function emptyStats(): GameStats {
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: Array(DISTRIBUTION_SIZE).fill(0) };
}

export function applyGameResult(stats: GameStats, won: boolean, attempts: number): GameStats {
  const currentStreak = won ? stats.currentStreak + 1 : 0;
  const distribution = [...stats.distribution];
  if (won && attempts >= 1 && attempts <= DISTRIBUTION_SIZE) distribution[attempts - 1]++;
  return {
    played: stats.played + 1,
    wins: stats.wins + Number(won),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
  };
}

export function loadStats(kind: GameKind, mode?: GameMode): GameStats {
  try {
    const stored: unknown = JSON.parse(safeStorageGet(getStatsStorageKey(kind, mode)) ?? 'null');
    if (!stored || typeof stored !== 'object') return emptyStats();
    const value = stored as Record<string, unknown>;
    const distribution = Array.isArray(value.distribution) ? value.distribution : [];
    return {
      played: nonNegativeInteger(value.played),
      wins: nonNegativeInteger(value.wins),
      currentStreak: nonNegativeInteger(value.currentStreak),
      maxStreak: nonNegativeInteger(value.maxStreak),
      distribution: Array.from({ length: DISTRIBUTION_SIZE }, (_, index) => nonNegativeInteger(distribution[index])),
    };
  } catch {
    return emptyStats();
  }
}

export function recordGame(kind: GameKind, won: boolean, attempts: number, mode?: GameMode): GameStats {
  const next = applyGameResult(loadStats(kind), won, attempts);
  safeStorageSet(STORAGE_KEYS[kind], JSON.stringify(next));
  if (mode) {
    const modeStats = applyGameResult(loadStats(kind, mode), won, attempts);
    safeStorageSet(getStatsStorageKey(kind, mode), JSON.stringify(modeStats));
  }
  return next;
}

export function clearStats(kind: GameKind): GameStats {
  safeStorageRemove(STORAGE_KEYS[kind]);
  for (const mode of GAME_MODES) safeStorageRemove(getStatsStorageKey(kind, mode.id));
  return emptyStats();
}
