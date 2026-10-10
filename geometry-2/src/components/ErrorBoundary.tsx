import { Component, type ReactNode } from 'react';
import { BASE } from '../lib/paths';

/** Last line of defence: a friendly message instead of a blank page or stack trace. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Logged for developers only; users see the friendly message below.
    console.error('Geometry 2 error:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container main">
        <div className="card fatal">
          <h1>Something went wrong</h1>
          <p>Sorry — this page hit an unexpected problem. Your saved progress has not been changed.</p>
          <p>
            <a className="btn btn-primary" href={BASE}>Back to Geometry 2</a>
          </p>
        </div>
      </div>
    );
  }
}
