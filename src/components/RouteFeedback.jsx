import { Component, Suspense } from 'react';
import './RouteFeedback.css';

class RouteErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="route-feedback" role="alert">
          <h2>No pudimos cargar esta vista</h2>
          <p>Revisa tu conexión e intenta nuevamente.</p>
          <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function RouteFeedback({ children }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={
        <div className="route-feedback" role="status" aria-live="polite">
          <span className="route-feedback-spinner" aria-hidden="true" />
          <p>Cargando vista...</p>
        </div>
      }>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}
