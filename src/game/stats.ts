export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
}

const STORAGE_KEY = 'wordler:stats:v1';
const DISTRIBUTION_SIZE = 10;

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

export function loadStats(): GameStats {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || !Array.isArray(stored.distribution)) return emptyStats();
    return { ...emptyStats(), ...stored, distribution: [...stored.distribution, ...Array(DISTRIBUTION_SIZE).fill(0)].slice(0, DISTRIBUTION_SIZE) };
  } catch {
    return emptyStats();
  }
}

export function recordGame(stats: GameStats, won: boolean, attempts: number) {
  const next = applyGameResult(stats, won, attempts);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearStats() {
  localStorage.removeItem(STORAGE_KEY);
  return emptyStats();
}
