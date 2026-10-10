import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="card empty-state">
      <h1>Page not found</h1>
      <p>That page doesn’t exist in Basic Geometry. Try one of these instead:</p>
      <p className="hero-actions">
        <Link to="/" className="btn btn-primary">Overview</Link>
        <Link to="/play" className="btn btn-secondary">Pick a Pair</Link>
        <Link to="/calculator" className="btn btn-secondary">Calculator</Link>
        <Link to="/formulas" className="btn btn-secondary">Formulas</Link>
      </p>
    </section>
  );
}
