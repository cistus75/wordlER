import { FormEvent, useMemo, useState } from 'react';
import { characters } from './data/characters';
import { useGame } from './game/useGame';
import type { ComparableField, GuessResult, HintStatus } from './types';
import './styles.css';

const FIELD_LABELS: Record<ComparableField, string> = {
  gender: '성별',
  roles: '역할군',
  ranges: '사거리',
  weapons: '무기군',
  age: '나이',
  height: '키',
  weight: '몸무게',
};

const STATUS_TEXT: Record<HintStatus, string> = {
  exact: '일치',
  partial: '일부 일치',
  wrong: '불일치',
  higher: '↑',
  lower: '↓',
};

function displayValue(value: unknown): string {
  if (value === null) return '미상';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function resultCell(result: GuessResult, field: ComparableField) {
  if (result.hiddenFields.includes(field)) {
    return <td key={field} className="hint hidden">???</td>;
  }

  const hint = result.hints[field];
  return (
    <td key={field} className={`hint ${hint.status}`}>
      <span>{displayValue(hint.value)}</span>
      <small>{STATUS_TEXT[hint.status]}</small>
    </td>
  );
}

export default function App() {
  const game = useGame(characters);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    return characters
      .filter(
        (character) =>
          !game.guessedIds.has(character.id) &&
          character.name.toLowerCase().includes(value),
      )
      .slice(0, 8);
  }, [game.guessedIds, query]);

  const submit = (characterName: string) => {
    const character = characters.find((item) => item.name === characterName.trim());
    if (!character) return;

    const result = game.submitGuess(character);
    if (result) setQuery('');
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(query);
  };

  return (
    <main>
      <header>
        <h1>wordlER</h1>
        <p>이터널 리턴 실험체 속성 추리</p>
      </header>

      <section className="controls">
        <button
          className={game.mode === 'normal' ? 'active' : ''}
          onClick={() => game.setMode('normal')}
        >
          일반
        </button>
        <button
          className={game.mode === 'censored' ? 'active' : ''}
          onClick={() => game.setMode('censored')}
        >
          검열
        </button>
        <span>남은 기회: {game.remainingGuesses}</span>
      </section>

      {characters.length === 0 ? (
        <p className="empty">캐릭터 데이터를 추가하면 바로 플레이할 수 있습니다.</p>
      ) : (
        <>
          <form onSubmit={onSubmit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="실험체 이름"
              disabled={game.status !== 'playing'}
              autoComplete="off"
            />
            <button type="submit" disabled={game.status !== 'playing'}>
              제출
            </button>
          </form>

          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((character) => (
                <button key={character.id} onClick={() => submit(character.name)}>
                  {character.name}
                </button>
              ))}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>실험체</th>
                  {(Object.keys(FIELD_LABELS) as ComparableField[]).map((field) => (
                    <th key={field}>{FIELD_LABELS[field]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {game.guesses.map((result) => (
                  <tr key={result.character.id}>
                    <td>{result.character.name}</td>
                    {(Object.keys(FIELD_LABELS) as ComparableField[]).map((field) =>
                      resultCell(result, field),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {game.status !== 'playing' && game.answer && (
        <section className="result">
          <strong>
            {game.status === 'won'
              ? `정답: ${game.answer.name}`
              : `실패. 정답은 ${game.answer.name}`}
          </strong>
          <button onClick={() => game.reset()}>다음 실험체</button>
        </section>
      )}
    </main>
  );
}
