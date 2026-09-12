import { useEffect, useRef, useState } from 'react';
import { characters } from './data/characters';
import { useGame, MAX_GUESSES } from './game/useGame';
import { COMPARABLE_FIELDS } from './game/compare';
import { searchCharacters } from './game/search';
import type { ComparableField, Character, HintStatus } from './types';
import './styles.css';

const labels: Record<ComparableField, string> = {
  roles: '역할군', weapons: '무기', age: '나이 (세)', height: '키 (cm)', risk: '위험등급',
};
const statuses: Record<HintStatus, string> = {
  exact: '일치', partial: '일부 일치', wrong: '다름', higher: '정답이 더 높음', lower: '정답이 더 낮음',
};
const symbols: Record<HintStatus, string> = {
  exact: '✓', partial: '≈', wrong: '×', higher: '↑', lower: '↓',
};

function valueText(value: unknown) {
  if (value === null) return '미상';
  if (Array.isArray(value)) return value.join(' · ');
  return String(value);
}

export default function App() {
  const game = useGame(characters);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const focusNextRound = useRef(false);
  const matches = searchCharacters(characters, query);
  const suggestions = matches.filter(c => !game.guessedIds.has(c.id)).slice(0, 7);
  const showSuggestions = searchOpen && suggestions.length > 0 && game.status === 'playing';
  const latest = game.guesses.at(-1);

  useEffect(() => {
    if (showSuggestions) document.getElementById(`option-${suggestions[active]?.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, query, showSuggestions]);

  useEffect(() => {
    if (game.status !== 'playing') nextButton.current?.focus({ preventScroll: true });
    else if (focusNextRound.current) {
      input.current?.focus({ preventScroll: true });
      focusNextRound.current = false;
    }
  }, [game.status]);

  function submit(character?: Character) {
    if (!character) { setError('목록에서 실험체를 선택해주세요.'); return; }
    if (game.submitGuess(character)) {
      setQuery('');
      setError('');
      setActive(0);
      setSearchOpen(false);
      input.current?.focus({ preventScroll: true });
    }
  }

  function next() {
    focusNextRound.current = true;
    game.reset();
    setQuery('');
    setError('');
    setActive(0);
    setSearchOpen(false);
  }

  const searchMessage = error || (query.trim() && !suggestions.length
    ? matches.length ? '이미 추측한 실험체예요. 다른 이름을 입력해주세요.' : '찾는 실험체가 없어요. 이름이나 초성을 확인해주세요.'
    : '');

  return (
    <div className="app">
      <header className="site-header">
        <h1><img className="logo" src="/logo.svg" width="158" height="34" alt="wordlER" /></h1>
      </header>
      <main>
        <section className="game" aria-label="실험체 추리">
          <div className="intro">
            <h2>누구인지 알아내볼까요?</h2>
            <p>다섯 번의 추측으로 실험체를 찾아보세요.</p>
          </div>

          {game.status === 'playing' ? (
            <div className="input-panel">
              <div className="search-area" onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
              }}>
                <label className="sr-only" htmlFor="guess">실험체 이름</label>
                <form onSubmit={event => { event.preventDefault(); submit(suggestions[active]); }}>
                  <input
                    id="guess" ref={input} value={query}
                    placeholder="이름 또는 초성으로 검색" autoComplete="off" autoCapitalize="none" spellCheck={false}
                    role="combobox" aria-expanded={showSuggestions}
                    aria-controls={showSuggestions ? 'suggestions' : undefined}
                    aria-autocomplete="list" aria-describedby={searchMessage ? 'search-message' : undefined}
                    aria-activedescendant={showSuggestions ? `option-${suggestions[active]?.id}` : undefined}
                    onFocus={() => setSearchOpen(true)}
                    onChange={event => { setQuery(event.target.value); setActive(0); setError(''); setSearchOpen(true); }}
                    onKeyDown={event => {
                      if (event.nativeEvent.isComposing) {
                        if (event.key === 'Enter') event.preventDefault();
                        return;
                      }
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
                  <div id="suggestions" className="suggestions" role="listbox" aria-label="실험체 검색 결과">
                    {suggestions.map((character, index) => (
                      <button
                        id={`option-${character.id}`} role="option" type="button" tabIndex={-1}
                        aria-selected={active === index} className={active === index ? 'highlighted' : ''}
                        key={character.id} onMouseDown={event => event.preventDefault()}
                        onClick={() => submit(character)}
                      >
                        <img src={`/character/${character.id}.png`} width="38" height="38" alt="" />
                        <span className="suggestion-name"><strong>{character.name}</strong><small>{character.id}</small></span>
                        <span className="suggestion-enter" aria-hidden="true">↵</span>
                      </button>
                    ))}
                  </div>
                )}
                <p id="search-message" className="input-note" role="status">{searchMessage}</p>
              </div>
              <div className="input-bottom">
                <span>남은 기회 <strong>{MAX_GUESSES - game.guesses.length}</strong> / {MAX_GUESSES}</span>
                <button className="random" onClick={() => {
                  const remaining = characters.filter(character => !game.guessedIds.has(character.id));
                  submit(remaining[Math.floor(Math.random() * remaining.length)]);
                }}>랜덤 추측</button>
              </div>
            </div>
          ) : game.answer && (
            <div className={`result ${game.status}`}>
              <img src={`/character/${game.answer.id}.png`} width="64" height="64" alt="" />
              <div className="result-copy" role="status">
                <p>{game.status === 'won' ? `${game.guesses.length}번 만에 찾았어요!` : '아쉽지만, 정답은'}</p>
                <h2>{game.answer.name}</h2>
              </div>
              <button ref={nextButton} onClick={next}>다음 실험체 <span aria-hidden="true">→</span></button>
            </div>
          )}

          <div className="legend" aria-label="단서 읽는 법">
            <span className="exact">✓ 일치</span>
            <span className="partial">≈ 일부 일치</span>
            <span className="wrong">× 다름</span>
            <span className="direction">↑ 더 높음 · ↓ 더 낮음</span>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {game.status === 'playing' && latest ? `${latest.character.name} 추측 완료. ${MAX_GUESSES - game.guesses.length}번 남았습니다.` : ''}
          </p>
          <div className="results">
            {[...game.guesses].reverse().map((guess, index) => (
              <article className={`guess-card${index === 0 ? ' latest' : ''}`} key={guess.character.id} aria-label={`${game.guesses.length - index}번째 추측: ${guess.character.name}`}>
                <div className="character-cell">
                  <small>{String(game.guesses.length - index).padStart(2, '0')}</small>
                  <img className="character-mini" src={`/character/${guess.character.id}.png`} width="64" height="64" alt="" />
                  <h2>{guess.character.name}</h2>
                </div>
                <dl>
                  {COMPARABLE_FIELDS.map(field => (
                    <div className="attribute" key={field}>
                      <dt>{labels[field]}</dt>
                      <dd>
                        <span className={`hint ${guess.hints[field].status}`} title={statuses[guess.hints[field].status]}>
                          <b aria-hidden="true">{symbols[guess.hints[field].status]}</b>
                          {valueText(guess.hints[field].value)}
                          <span className="sr-only"> {statuses[guess.hints[field].status]}</span>
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          {!game.guesses.length && <p className="empty-board">익숙한 실험체부터 시작해보세요.</p>}
        </section>
      </main>
    </div>
  );
}


