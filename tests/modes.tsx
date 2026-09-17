import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useGame } from '../src/game/useGame';
import { useItemGame } from '../src/game/useItemGame';
import { characters } from '../src/data/characters';
import { items } from '../src/data/items';
import { buildItemGuessHints } from '../src/game/item';
import { exactCount } from '../src/game/rules';

let characterGame!: ReturnType<typeof useGame>;
let itemGame!: ReturnType<typeof useItemGame>;
function Harness() {
  characterGame = useGame(characters);
  itemGame = useItemGame(items);
  return null;
}
function check(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
const root = createRoot(document.getElementById('root')!);
const lines: string[] = [];
try {
  flushSync(() => root.render(<StrictMode><Harness /></StrictMode>));
  for (const kind of ['character', 'item'] as const) {
    const game = () => kind === 'character' ? characterGame : itemGame;
    const submitAnswer = () => flushSync(() => {
      if (kind === 'character') characterGame.submitGuess(characterGame.answer!);
      else itemGame.submitGuess(itemGame.answer!);
    });
    const miss = () => flushSync(() => {
      if (kind === 'character') characterGame.submitGuess(characters.find(c => c.id !== characterGame.answer?.id && !characterGame.guessedIds.has(c.id))!);
      else itemGame.submitGuess(items.find(i => i.code !== itemGame.answer?.code && !itemGame.guessedCodes.has(i.code) && Object.values(buildItemGuessHints(i, itemGame.answer!)).some(h => h.status !== 'exact'))!);
    });
    flushSync(() => game().setMode('cipher'));
    for (let i = 0; i < 4; i++) miss();
    check(game().status === 'playing', `${kind}: cipher fourth guess`);
    submitAnswer();
    check(game().status === 'won', `${kind}: last chance win`);
    check(exactCount(game().guesses.at(-1)!.hints) === 5, `${kind}: cipher answer score`);
    flushSync(() => game().reset());
    for (let i = 0; i < 5; i++) miss();
    check(game().status === 'lost', `${kind}: cipher fifth miss loses`);
    flushSync(() => game().setMode('liar'));
    for (let i = 0; i < 4; i++) miss();
    check(game().guesses.every(g => g.lie && Object.entries(g.hints).some(([field, hint]) => field === g.lie!.field && hint.status !== g.lie!.truth)), `${kind}: each miss lies`);
    submitAnswer();
    check(game().status === 'won' && !game().guesses.at(-1)!.lie, `${kind}: liar last chance honest win`);
    flushSync(() => game().reset());
    for (let i = 0; i < 5; i++) miss();
    check(game().status === 'lost', `${kind}: liar fifth miss loses`);
    flushSync(() => game().setMode('relay'));
    const answers = new Set();
    for (let round = 1; round <= 3; round++) {
      answers.add(game().answer);
      check(game().round === round && game().guesses.length === 0, `${kind}: next round reset`);
      for (let i = 0; i < 4; i++) miss();
      submitAnswer();
      check(game().status === (round < 3 ? 'round-won' : 'won'), `${kind}: relay status ${round}`);
      submitAnswer();
      check(game().guesses.length === 5, `${kind}: finished round rejects submission`);
      flushSync(() => game().advance());
    }
    check(answers.size === 3, `${kind}: no repeated relay answers`);
    check(game().previousAttempts === 10 && game().guesses.length === 5, `${kind}: fifteen attempts preserved`);
    flushSync(() => game().reset());
    check(game().round === 1 && game().previousAttempts === 0, `${kind}: restart clears relay`);
    submitAnswer();
    flushSync(() => game().advance());
    for (let i = 0; i < 5; i++) miss();
    check(game().status === 'lost' && game().round === 2, `${kind}: intermediate loss ends run`);
    flushSync(() => game().setMode('classic'));
    check(game().round === 1 && game().previousAttempts === 0 && game().guesses.length === 0, `${kind}: mode switch clears relay`);
    lines.push(`${kind}: 암호 · 이중첩자 5회 승패 · 연속 출제 전환/재시작 통과`);
  }
  flushSync(() => itemGame.setMode('relay'));
  for (let i = 0; i < 4; i++) {
    flushSync(() => itemGame.submitGuess(items.find(item => item.code !== itemGame.answer?.code && !itemGame.guessedCodes.has(item.code) && Object.values(buildItemGuessHints(item, itemGame.answer!)).some(hint => hint.status !== 'exact'))!));
  }
  const twin = { ...itemGame.answer!, code: -1, name: '동일 속성 테스트' };
  flushSync(() => itemGame.submitGuess(twin));
  check(itemGame.status === 'playing' && itemGame.attempts === 4, 'free guess preserves last chance');
  flushSync(() => itemGame.submitGuess(twin));
  check(itemGame.guesses.length === 5, 'duplicate free guess rejected');
  flushSync(() => itemGame.submitGuess(itemGame.answer!));
  check(itemGame.status === 'round-won' && itemGame.attempts === 5, 'free guess excluded from winning attempts');
  flushSync(() => itemGame.advance());
  check(itemGame.previousAttempts === 5 && itemGame.attempts === 0, 'relay carries charged attempts only');
  lines.push('item: 마지막 기회 면제 · 중복 추측 차단 · 누적 시도 통과');
  for (const mode of ['cipher', 'liar'] as const) {
    flushSync(() => itemGame.setMode(mode));
    flushSync(() => itemGame.submitGuess({ ...itemGame.answer!, code: -1 }));
    check(itemGame.status === 'playing', `${mode}: matching profile is not a win`);
    check(itemGame.attempts === (mode === 'cipher' ? 0 : 1), `${mode}: profile exemption does not leak a lie`);
  }
  document.getElementById('result')!.textContent = `PASS\n${lines.join('\n')}`;
} catch (error) {
  document.getElementById('result')!.textContent = `FAIL\n${String(error)}`;
  throw error;
} finally {
  root.unmount();
}
