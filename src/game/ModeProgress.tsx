import type { GameMode, GameStatus } from '../types';
import { RELAY_ROUNDS } from './rules';

export default function ModeProgress({ mode, status, round, attempts, totalAttempts, hiddenLabel }: {
  mode: GameMode;
  status: GameStatus;
  round: number;
  attempts: number;
  totalAttempts: number;
  hiddenLabel: string;
}) {
  if (mode === 'taboo') return <p className="mode-progress">이번 판 금지 속성: <strong>{hiddenLabel}</strong></p>;
  if (mode === 'reverse') return <p className="mode-progress">{status === 'playing' ? `다음 추측에 공개되는 속성 ${Math.max(1, 5 - attempts)}개` : '이전 단서를 다시 살펴보세요.'}</p>;
  if (mode !== 'relay') return null;
  const cleared = round - 1 + Number(status === 'won' || status === 'round-won');
  return <div className="mode-progress" role="status">
    <strong>{status === 'won' ? '3연속 클리어!' : status === 'lost' ? '도전 종료' : `${round}번째 문제`}</strong>
    <span>{cleared} / {RELAY_ROUNDS} 정답 · 누적 {totalAttempts}회 시도</span>
  </div>;
}
