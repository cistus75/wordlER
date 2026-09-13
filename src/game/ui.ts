import type { GameMode, HintStatus } from '../types';

export const GAME_MODES: { id: GameMode; label: string; description: string }[] = [
  { id: 'classic', label: '기본', description: '모든 속성을 확인할 수 있어요.' },
  { id: 'sealed', label: '봉인', description: '매 추측마다 무작위 속성 2개가 잠겨요.' },
  { id: 'fog', label: '안개', description: '매 추측마다 속성이 하나씩 열려요.' },
  { id: 'single', label: '단일', description: '한 판 동안 무작위 속성 하나만 보여요.' },
  { id: 'coward', label: '슈퍼겁쟁이', description: '허접~ 허접~ 이것도 못 맞추는 허접 유저~' },
];
export const HINT_STATUSES: Record<HintStatus, string> = {
  exact: '일치', partial: '일부 일치', wrong: '다름', higher: '정답이 더 높음', lower: '정답이 더 낮음',
};
export const HINT_SYMBOLS: Record<HintStatus, string> = {
  exact: '✓', partial: '≈', wrong: '×', higher: '↑', lower: '↓',
};
export const HINT_LEGEND = [
  { className: 'exact', text: '✓ 일치' },
  { className: 'partial', text: '≈ 일부 일치' },
  { className: 'wrong', text: '× 다름' },
  { className: 'direction', text: '↑ 더 높음' },
  { className: 'direction', text: '↓ 더 낮음' },
];
