import type { GameMode, GameStatus } from '../types';
import { RELAY_ROUNDS } from './rules';

export default function ModeProgress({ mode, status, round, totalAttempts }: {
  mode: GameMode;
  status: GameStatus;
  round: number;
  totalAttempts: number;
}) {
  if (mode !== 'relay') return null;
  const cleared = round - 1 + Number(status === 'won' || status === 'round-won');
  return <div className="mode-progress" role="status">
    <strong>{status === 'won' ? '3연속 클리어!' : status === 'lost' ? '도전 종료' : `${round}번째 문제`}</strong>
    <span>{cleared} / {RELAY_ROUNDS} 정답 · 누적 {totalAttempts}회 시도</span>
  </div>;
}
