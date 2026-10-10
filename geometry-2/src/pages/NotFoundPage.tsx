import { Link } from 'react-router-dom';
import { GinaSays } from '../components/Gina';

export function NotFoundPage() {
  return (
    <section className="card">
      <GinaSays pose="reassuring" text="Hmm, I can’t find that page. Let’s head back and pick a topic." />
      <p><Link className="btn btn-primary" to="/">Back to Geometry 2</Link></p>
    </section>
  );
}
