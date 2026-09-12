import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="error-screen">
          <img src="/logo.svg" width="158" height="34" alt="wordlER" />
          <h1>게임을 불러오지 못했어요.</h1>
          <p>잠시 후 다시 시도해주세요.</p>
          <button onClick={() => window.location.reload()}>새로고침</button>
        </main>
      );
    }
    return this.props.children;
  }
}
