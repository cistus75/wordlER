import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { items } from './data/items';
import { ITEM_FIELDS, ITEM_LABELS, itemGuessCost, searchItems } from './game/item';
import { SEARCH_QUERY_MAX_LENGTH } from './game/search';
import { useItemGame } from './game/useItemGame';
import { GAME_MODES, HINT_LEGEND, HINT_STATUSES, HINT_SYMBOLS } from './game/ui';
import type { GameMode, NormalizedItem } from './types';
import ModeProgress from './game/ModeProgress';
import { exactCount, guessStatus } from './game/rules';

function valueText(value: string | string[]) {
  return Array.isArray(value) ? value.join(' · ') : value;
}

export default function ItemGame({ onFinished }: { onFinished: (won: boolean, attempts: number, mode: GameMode, cleared: number) => void }) {
  const game = useItemGame(items);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const successDialog = useRef<HTMLDialogElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const matches = useMemo(() => searchItems(items, query), [query]);
  const suggestions = useMemo(() => matches.filter(item => !game.guessedCodes.has(item.code)).slice(0, 7), [matches, game.guessedCodes]);
  const showSuggestions = searchOpen && suggestions.length > 0 && game.status === 'playing';
  const latest = game.guesses.at(-1);

  useEffect(() => {
    if (showSuggestions) document.getElementById(`item-option-${suggestions[active]?.code}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, query, showSuggestions]);

  useEffect(() => {
    if (game.status === 'won' || game.status === 'round-won') {
      successDialog.current?.showModal();
      nextButton.current?.focus({ preventScroll: true });
    } else if (game.status === 'lost') {
      nextButton.current?.focus({ preventScroll: true });
    }
  }, [game.status]);

  function clearInput() {
    setQuery('');
    setError('');
    setActive(0);
    setSearchOpen(false);
  }

  function submit(item?: NormalizedItem) {
    if (!item) { setError('목록에서 아이템을 선택해주세요.'); return; }
    const result = game.submitGuess(item);
    if (result) {
      const won = game.answer?.code === item.code;
      const attempts = game.attempts + itemGuessCost(result);
      const status = guessStatus(game.mode, won, attempts, game.round);
      if (status === 'won' || status === 'lost') onFinished(won, game.previousAttempts + attempts, game.mode, game.mode === 'relay' ? game.round - 1 + Number(won) : 0);
      clearInput();
      input.current?.focus({ preventScroll: true });
    }
  }

  function next() {
    successDialog.current?.close();
    if (game.status === 'round-won') game.advance();
    else game.reset();
    clearInput();
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
  }

  const searchMessage = error || (query.trim() && !suggestions.length
    ? matches.length ? '이미 추측한 아이템이에요. 다른 이름을 입력해주세요.' : '찾는 아이템이 없어요. 이름이나 코드를 확인해주세요.'
    : '');

  return (
    <section className="game item-game" aria-label="아이템 추리">
      <div className="intro">
        <h2>어떤 아이템인지 맞춰볼까요?</h2>
        <p>{GAME_MODES.find(mode => mode.id === game.mode)?.description}</p>
      </div>
      <div className="mode-tabs" aria-label="아이템 게임 모드">
        {GAME_MODES.map(mode => (
          <button key={mode.id} className={game.mode === mode.id ? 'active' : ''} aria-pressed={game.mode === mode.id} onClick={() => { game.setMode(mode.id); clearInput(); }}>
            {mode.label}
          </button>
        ))}
      </div>

      {game.status === 'playing' ? (
        <div className="input-panel">
          <div className="search-area" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
            <label className="sr-only" htmlFor="item-guess">아이템 이름</label>
            <form onSubmit={event => { event.preventDefault(); submit(suggestions[active]); }}>
              <input type="search" enterKeyHint="search" maxLength={SEARCH_QUERY_MAX_LENGTH}
                id="item-guess" ref={input} value={query} placeholder="이름·초성으로 검색"
                autoComplete="off" autoCapitalize="none" spellCheck={false} role="combobox"
                aria-expanded={showSuggestions} aria-controls={showSuggestions ? 'item-suggestions' : undefined}
                aria-autocomplete="list" aria-describedby={searchMessage ? 'item-search-message' : undefined}
                aria-activedescendant={showSuggestions ? `item-option-${suggestions[active]?.code}` : undefined}
                onFocus={() => setSearchOpen(true)}
                onChange={event => { setQuery(event.target.value); setActive(0); setError(''); setSearchOpen(true); }}
                onKeyDown={event => {
                  if (event.nativeEvent.isComposing) { if (event.key === 'Enter') event.preventDefault(); return; }
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    setSearchOpen(true);
                    const step = event.key === 'ArrowDown' ? 1 : -1;
                    setActive(current => suggestions.length ? (current + step + suggestions.length) % suggestions.length : 0);
                  }
                  if (event.key === 'Escape') { event.preventDefault(); setSearchOpen(false); }
                }}
              />
              <button disabled={!suggestions.length} type="submit">추측하기</button>
            </form>
            {showSuggestions && (
              <div id="item-suggestions" className="suggestions" role="listbox" aria-label="아이템 검색 결과">
                {suggestions.map(item => {
                  const highlighted = suggestions[active]?.code === item.code;
                  return (
                  <button
                    id={`item-option-${item.code}`} role="option" type="button" tabIndex={-1}
                    aria-selected={highlighted} className={highlighted ? 'highlighted' : ''}
                    key={item.code} onMouseDown={event => event.preventDefault()} onClick={() => submit(item)}
                  >
                    <img src={item.image} width="38" height="38" alt="" />
                    <span className="suggestion-name"><strong>{item.name}</strong><small>{item.englishName} · {item.gradeLabel} · {item.categoryLabel}</small></span>
                    <span className="suggestion-enter" aria-hidden="true">↵</span>
                  </button>
                  );
                })}
                <div className="suggestion-help" role="presentation">↑↓ 이동 · Enter 선택 · Esc 닫기</div>
              </div>
            )}
            <p id="item-search-message" className="input-note" role="status">{searchMessage}</p>
          </div>
          <div className="input-bottom">
            <div className="attempt-info">
            <span className="chances">남은 기회 <strong>{game.maxGuesses - game.attempts}</strong><small>/ {game.maxGuesses}</small></span>
            <ModeProgress mode={game.mode} status={game.status} round={game.round} totalAttempts={game.previousAttempts + game.attempts} />
            </div>
            <button className="random" onClick={() => {
              const remaining = items.filter(item => !game.guessedCodes.has(item.code));
              submit(remaining[Math.floor(Math.random() * remaining.length)]);
            }}><span aria-hidden="true">↻</span> 랜덤 추측</button>
          </div>
        </div>
      ) : game.answer && (
        <div className={`result ${game.status}`}>
          <img src={game.answer.image} width="64" height="64" alt="" />
          <div className="result-copy" role="status">
            <p>{game.status !== 'lost' ? `${game.attempts}번 만에 찾았어요!` : '정답은'}</p>
            <h2>{game.answer.name}</h2>
            <ModeProgress mode={game.mode} status={game.status} round={game.round} totalAttempts={game.previousAttempts + game.attempts} />
          </div>
          <button ref={game.status === 'lost' ? nextButton : undefined} onClick={next}>{game.status === 'round-won' ? '다음 문제' : '다시하기'} <span aria-hidden="true">→</span></button>
        </div>
      )}

      <div className="legend" aria-label="단서 읽는 법">
        {HINT_LEGEND.map(entry => <span className={entry.className} key={entry.text}>{entry.text}</span>)}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {game.status === 'playing' && latest ? `${latest.item.name} 추측 완료. ${game.maxGuesses - game.attempts}번 남았습니다.` : ''}
      </p>
      <div className="results">
        {[...game.guesses].reverse().map((guess, index) => (
          <article className={`guess-card item-card${index === 0 ? ' latest' : ''}`} key={guess.item.code} aria-label={`${game.guesses.length - index}번째 추측: ${guess.item.name}`}>
            <div className="character-cell reveal-tile" style={{ '--tile-index': 0 } as CSSProperties}>
              <small>{String(game.guesses.length - index).padStart(2, '0')}</small>
              <img className="character-mini" src={guess.item.image} width="64" height="64" alt="" />
              <h2>{guess.item.name}</h2>
            </div>
            <dl>
              {ITEM_FIELDS.map((field, fieldIndex) => (
                <div className="attribute reveal-tile" key={field} style={{ '--tile-index': fieldIndex + 1 } as CSSProperties}>
                  <dt>{ITEM_LABELS[field]}</dt>
                  <dd>{game.mode === 'cipher' ? <span className="hint neutral">{valueText(guess.hints[field].value)}</span> : guess.hiddenFields.includes(field) ? (
                    <span className="hint locked"><b aria-hidden="true">?</b><span className="sr-only">봉인</span></span>
                  ) : (
                    <span className={`hint ${guess.hints[field].status}`} title={HINT_STATUSES[guess.hints[field].status]}>
                      <b aria-hidden="true">{HINT_SYMBOLS[guess.hints[field].status]}</b>{valueText(guess.hints[field].value)}
                      <span className="sr-only"> {HINT_STATUSES[guess.hints[field].status]}</span>
                    </span>
                  )}</dd>
                </div>
              ))}
            </dl>
            {game.mode === 'cipher' && <p className="deduction-summary">완전 일치 <strong>{exactCount(guess.hints)} / 5</strong></p>}
            {game.status !== 'playing' && guess.lie && <p className="deduction-summary">거짓 단서: <strong>{ITEM_LABELS[guess.lie.field]}</strong> · 실제 판정: {HINT_STATUSES[guess.lie.truth]}</p>}
            {itemGuessCost(guess) === 0 && <p className="same-profile">모든 속성이 같아 기회를 차감하지 않았어요.</p>}
          </article>
        ))}
      </div>
      {!game.guesses.length && <p className="empty-board">익숙한 아이템부터 시작해보세요.</p>}

      <dialog className="success-dialog item-success" ref={successDialog} onCancel={() => successDialog.current?.close()}>
        {(game.status === 'won' || game.status === 'round-won') && game.answer && (
          <div className="success-content">
            <button className="dialog-close" aria-label="닫기" onClick={() => successDialog.current?.close()}>×</button>
            <div className="success-art"><img src={game.answer.image} alt={`${game.answer.name} 아이콘`} /></div>
            <div className="success-copy">
              <span className="success-label">{game.mode === 'relay' ? game.status === 'won' ? '3연속 클리어!' : `${game.round}번째 문제 성공!` : '정답입니다'}</span><h2>{game.answer.name}</h2>
              <dl><div><dt>도전 횟수</dt><dd>{game.attempts} / {game.maxGuesses}</dd></div><div><dt>게임 모드</dt><dd>{GAME_MODES.find(mode => mode.id === game.mode)?.label} 모드</dd></div></dl>
              {game.mode === 'relay' && <p className="relay-total">누적 {game.previousAttempts + game.attempts}회 시도</p>}
              <button ref={nextButton} onClick={next}>{game.status === 'round-won' ? '다음 문제' : '다시하기'} <span aria-hidden="true">→</span></button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
