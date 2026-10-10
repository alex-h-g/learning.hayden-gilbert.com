import { BADGES, badgeById } from '../lib/progress';
import { useStore } from '../lib/store';
import { GinaImg } from './Gina';

export function BadgeToast({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  if (!ids.length) return null;
  const bs = ids.map(badgeById).filter(Boolean);
  return (
    <div className="badge-toast" role="status">
      <GinaImg pose="cheering" size="sm" />
      <div>
        <strong>New badge{bs.length > 1 ? 's' : ''}!</strong>{' '}
        {bs.map((b) => (
          <span key={b!.id} className="badge-pill"><span aria-hidden="true">{b!.icon}</span> {b!.name}</span>
        ))}
      </div>
      <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}

export function BadgeGrid() {
  const { data } = useStore();
  const earned = new Map(data.badges.map((b) => [b.id, b.at]));
  return (
    <ul className="badge-grid">
      {BADGES.map((b) => {
        const got = earned.has(b.id);
        return (
          <li key={b.id} className={`badge ${got ? 'earned' : 'locked'}`}>
            <span className="badge-icon" aria-hidden="true">{got ? b.icon : '🔒'}</span>
            <span className="badge-name">{b.name}</span>
            <span className="badge-how">{got ? '✓ Earned' : b.how}</span>
          </li>
        );
      })}
    </ul>
  );
}
