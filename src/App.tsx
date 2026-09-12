import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { characters } from './data/characters';
import { useGame, MAX_GUESSES } from './game/useGame';
import { COMPARABLE_FIELDS } from './game/compare';
import { searchCharacters } from './game/search';
import { clearStats, loadStats, recordGame } from './game/stats';
import type { ComparableField, Character, GameMode, HintStatus } from './types';
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
const modes: { id: GameMode; label: string; description: string }[] = [
  { id: 'classic', label: '기본', description: '모든 속성을 확인할 수 있어요.' },
  { id: 'sealed', label: '봉인', description: '매 추측마다 무작위 속성 2개가 잠겨요.' },
  { id: 'fog', label: '안개', description: '매 추측마다 속성이 하나씩 열려요.' },
  { id: 'single', label: '단일', description: '한 판 동안 무작위 속성 하나만 보여요.' },
];
type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const stored = localStorage.getItem('wordler:theme');
  const theme = stored === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  return theme;
}

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
  const successDialog = useRef<HTMLDialogElement>(null);
  const statsDialog = useRef<HTMLDialogElement>(null);
  const focusNextRound = useRef(false);
  const [stats, setStats] = useState(loadStats);
  const [theme, setTheme] = useState<Theme>(initialTheme);
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

  useEffect(() => {
    if (game.status === 'won') successDialog.current?.showModal();
  }, [game.status]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('wordler:theme', theme);
  }, [theme]);

  function submit(character?: Character) {
    if (!character) { setError('목록에서 실험체를 선택해주세요.'); return; }
    const result = game.submitGuess(character);
    if (result) {
      const won = game.answer?.id === character.id;
      const attempts = game.guesses.length + 1;
      if (won || attempts === MAX_GUESSES) {
        setStats(current => recordGame(current, won, attempts));
      }
      setQuery('');
      setError('');
      setActive(0);
      setSearchOpen(false);
      input.current?.focus({ preventScroll: true });
    }
  }

  function next() {
    successDialog.current?.close();
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
        <h1><img className="logo" src={theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'} width="158" height="34" alt="wordlER" /></h1>
        <div className="header-actions">
          <button className="theme-toggle" aria-pressed={theme === 'dark'} onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}>
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span> {theme === 'dark' ? '라이트' : '다크'}
          </button>
          <button className="stats-button" onClick={() => statsDialog.current?.showModal()} aria-label="통계 보기">
            <span aria-hidden="true">▥</span> 통계
          </button>
        </div>
      </header>
      <main>
        <section className="game" aria-label="실험체 추리">
          <div className="intro">
            <h2>누구인지 맞춰볼까요?</h2>
            <p>{modes.find(mode => mode.id === game.mode)?.description}</p>
          </div>

          <div className="mode-tabs" aria-label="게임 모드">
            {modes.map(mode => (
              <button key={mode.id} className={game.mode === mode.id ? 'active' : ''} aria-pressed={game.mode === mode.id} onClick={() => game.setMode(mode.id)}>
                {mode.label}
              </button>
            ))}
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
                    placeholder="이름·초성으로 검색" autoComplete="off" autoCapitalize="none" spellCheck={false}
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
                <span className="chances">남은 기회 <strong>{MAX_GUESSES - game.guesses.length}</strong><small>/ {MAX_GUESSES}</small></span>
                <button className="random" onClick={() => {
                  const remaining = characters.filter(character => !game.guessedIds.has(character.id));
                  submit(remaining[Math.floor(Math.random() * remaining.length)]);
                }}><span aria-hidden="true">↻</span> 랜덤 추측</button>
              </div>
            </div>
          ) : game.answer && (
            <div className={`result ${game.status}`}>
              <img src={`/character/${game.answer.id}.png`} width="64" height="64" alt="" />
              <div className="result-copy" role="status">
                <p>{game.status === 'won' ? `${game.guesses.length}번 만에 찾았어요!` : '정답은'}</p>
                <h2>{game.answer.name}</h2>
              </div>
              <button ref={game.status === 'lost' ? nextButton : undefined} onClick={next}>다시하기 <span aria-hidden="true">→</span></button>
            </div>
          )}

          <div className="legend" aria-label="단서 읽는 법">
            <span className="exact">✓ 일치</span>
            <span className="partial">≈ 일부 일치</span>
            <span className="wrong">× 다름</span>
            <span className="direction">↑ 더 높음</span>
            <span className="direction">↓ 더 낮음</span>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {game.status === 'playing' && latest ? `${latest.character.name} 추측 완료. ${MAX_GUESSES - game.guesses.length}번 남았습니다.` : ''}
          </p>
          <div className="results">
            {[...game.guesses].reverse().map((guess, index) => (
              <article className={`guess-card${index === 0 ? ' latest' : ''}`} key={guess.character.id} aria-label={`${game.guesses.length - index}번째 추측: ${guess.character.name}`}>
                <div className="character-cell reveal-tile" style={{ '--tile-index': 0 } as CSSProperties}>
                  <small>{String(game.guesses.length - index).padStart(2, '0')}</small>
                  <img className="character-mini" src={`/character/${guess.character.id}.png`} width="64" height="64" alt="" />
                  <h2>{guess.character.name}</h2>
                </div>
                <dl>
                  {COMPARABLE_FIELDS.map((field, fieldIndex) => (
                    <div className="attribute reveal-tile" key={field} style={{ '--tile-index': fieldIndex + 1 } as CSSProperties}>
                      <dt>{labels[field]}</dt>
                      <dd>
                        {guess.hiddenFields.includes(field) ? (
                          <span className="hint locked"><b aria-hidden="true">?</b><span className="sr-only">봉인</span></span>
                        ) : (
                          <span className={`hint ${guess.hints[field].status}`} title={statuses[guess.hints[field].status]}>
                            <b aria-hidden="true">{symbols[guess.hints[field].status]}</b>
                            {valueText(guess.hints[field].value)}
                            <span className="sr-only"> {statuses[guess.hints[field].status]}</span>
                          </span>
                        )}
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
      <footer className="site-footer">
        <p>wordlER는 Nimble Neuron과 관련 없는 비공식 프로젝트입니다. 이터널 리턴 및 관련 캐릭터·명칭·이미지·로고의 지식재산권은 Nimble Neuron Corp. 및 각 권리자에게 있습니다.</p>
        <p>본 안내를 확인하고 사이트를 이용하는 경우, Cloudflare Web Analytics를 통한 개인 식별 없는 방문 통계 수집에 동의한 것으로 간주됩니다.</p>
        <p>게임 통계와 테마 설정은 브라우저의 로컬 저장소에만 저장되며 서버로 전송되지 않습니다.</p>
      </footer>
      <dialog className="success-dialog" ref={successDialog} onCancel={() => successDialog.current?.close()}>
        {game.status === 'won' && game.answer && (
          <div className="success-content">
            <button className="dialog-close" aria-label="닫기" onClick={() => successDialog.current?.close()}>×</button>
            <div className="success-art">
              <img
                src={`/character/full/${game.answer.id}.png`}
                alt={`${game.answer.name} 전신 이미지`}
                onError={event => { event.currentTarget.src = `/character/${game.answer?.id}.png`; event.currentTarget.classList.add('fallback'); }}
              />
            </div>
            <div className="success-copy">
              <span className="success-label">정답입니다</span>
              <h2>{game.answer.name}</h2>
              <dl>
                <div><dt>도전 횟수</dt><dd>{game.guesses.length} / {MAX_GUESSES}</dd></div>
                <div><dt>게임 모드</dt><dd>{modes.find(mode => mode.id === game.mode)?.label} 모드</dd></div>
              </dl>
              <button ref={nextButton} onClick={next}>다시하기 <span aria-hidden="true">→</span></button>
            </div>
          </div>
        )}
      </dialog>
      <dialog className="stats-dialog" ref={statsDialog} onCancel={() => statsDialog.current?.close()}>
        <div className="stats-content">
          <button className="dialog-close" aria-label="닫기" onClick={() => statsDialog.current?.close()}>×</button>
          <h2>게임 통계</h2>
          <p>이 브라우저의 기기에만 저장됩니다.</p>
          <div className="stats-summary">
            <div><strong>{stats.played}</strong><span>플레이</span></div>
            <div><strong>{stats.played ? Math.round(stats.wins / stats.played * 100) : 0}%</strong><span>승률</span></div>
            <div><strong>{stats.currentStreak}</strong><span>현재 연승</span></div>
            <div><strong>{stats.maxStreak}</strong><span>최장 연승</span></div>
          </div>
          <section className="distribution" aria-labelledby="distribution-title">
            <h3 id="distribution-title">시도 횟수 분포</h3>
            {stats.distribution.map((count, index) => {
              const max = Math.max(...stats.distribution, 1);
              return (
                <div className="distribution-row" key={index}>
                  <span>{index + 1}</span>
                  <div className="distribution-track">
                    <div className="distribution-bar" style={{ width: count ? `${Math.max(count / max * 100, 10)}%` : '0' }}>
                      {count > 0 && <strong>{count}</strong>}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
          <button className="clear-stats" onClick={() => setStats(clearStats())}>기록 삭제</button>
        </div>
      </dialog>
    </div>
  );
}
