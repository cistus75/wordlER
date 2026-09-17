import type { GameMode, HintStatus } from '../types';

export const GAME_MODES: { id: GameMode; label: string; description: string }[] = [
  { id: 'classic', label: '기본', description: '모든 속성을 확인할 수 있어요.' },
  { id: 'sealed', label: '봉인', description: '매 추측마다 무작위 속성 2개가 잠겨요.' },
  { id: 'fog', label: '안개', description: '매 추측마다 속성이 하나씩 열려요.' },
  { id: 'single', label: '단일', description: '한 판 동안 무작위 속성 하나만 보여요.' },
  { id: 'coward', label: '슈퍼겁쟁이', description: '허접~ 허접~ 이것도 못 맞추는 허접 유저~' },
  { id: 'manly', label: '사나이클럽', description: '겁쟁이 출입 금지.' },
  { id: 'cipher', label: '암호', description: '어떤 속성인지는 비밀. 완전히 일치하는 속성 수만 보여요.' },
  { id: 'liar', label: '첩자', description: '오답마다 하나의 판정이 거짓이에요.' },
  { id: 'relay', label: '연속 출제', description: '정답 3개를 연속으로 맞혀요.' },
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
