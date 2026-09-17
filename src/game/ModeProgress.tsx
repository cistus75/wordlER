import type { GameMode, GameStatus } from '../types';
import { RELAY_ROUNDS } from './rules';

export default function ModeProgress({ mode, status, round, totalAttempts }: {
  mode: GameMode;
  status: GameStatus;
  round: number;
  totalAttempts: number;
}) {
  if (mode === 'cipher') return <p className="mode-progress">속성값은 추측한 대상의 정보예요. 5개 일치해도 이름까지 맞혀야 정답!</p>;
  if (mode === 'liar') return <p className="mode-progress">{status === 'playing' ? '거짓 위치는 매번 무작위이며 정답에는 거짓이 없어요. 종료 후 거짓 단서를 공개해요.' : '각 추측 아래에서 거짓 속성과 실제 판정을 확인하세요.'}</p>;
  if (mode !== 'relay') return null;
  const cleared = round - 1 + Number(status === 'won' || status === 'round-won');
  return <div className="mode-progress" role="status">
    <strong>{status === 'won' ? '3연속 클리어!' : status === 'lost' ? '도전 종료' : `${round}번째 문제`}</strong>
    <span>{cleared} / {RELAY_ROUNDS} 정답 · 누적 {totalAttempts}회 시도</span>
  </div>;
}
