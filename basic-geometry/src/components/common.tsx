import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { historyStore } from '../lib/history';
import { CHEAT_SHEET_FILENAME, CHEAT_SHEET_URL } from '../lib/paths';
import { useHistory } from '../lib/useHistory';

/** FREE DOWNLOAD button — links to the real supplied PDF (no sign-up). */
export function DownloadButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`btn btn-download ${compact ? 'btn-sm' : ''}`}
      href={CHEAT_SHEET_URL}
      download={CHEAT_SHEET_FILENAME}
      type="application/pdf"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16" />
      </svg>
      <span>
        <strong>Free download:</strong> Geometry formula cheat sheet
      </span>
      <span className="badge-pdf">PDF</span>
    </a>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible modal confirmation built on the native <dialog> element. */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, onConfirm, onCancel }: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <h2 id={titleId} className="dialog-title">{title}</h2>
      <div className="dialog-body">{children}</div>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

/**
 * Reset Progress: clears all saved learning history in this browser, e.g. when
 * several learners share one computer. Always asks for confirmation first.
 */
export function ResetProgressButton({ className = 'btn btn-secondary', label = 'Reset progress', onReset }: { className?: string; label?: string; onReset?: () => void }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const { data } = useHistory();
  const hasData = Object.keys(data.stats).length > 0 || data.sessions.length > 0;
  return (
    <>
      <button type="button" className={className} onClick={() => { setDone(false); setOpen(true); }}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        {label}
      </button>
      <span className="sr-only" role="status">{done ? 'Progress has been reset.' : ''}</span>
      {done && <span className="reset-done" aria-hidden="true">✓ Progress reset — starting fresh.</span>}
      <ConfirmDialog
        open={open}
        title="Reset all progress?"
        confirmLabel="Yes, reset progress"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          historyStore.clear();
          setOpen(false);
          setDone(true);
          onReset?.();
        }}
      >
        <p>
          This permanently deletes every saved mistake, score and session <strong>in this browser</strong>, so the next player starts
          completely fresh. It cannot be undone.
        </p>
        {!hasData && <p className="muted">There is currently no saved progress to delete.</p>}
      </ConfirmDialog>
    </>
  );
}

/** Explains storage problems: unavailable, unreadable, partially skipped, or failed writes. */
export function StorageNotice() {
  const snap = useHistory();
  if (snap.loadIssue?.kind === 'corrupt') {
    return (
      <div className="alert alert-error" role="alert">
        <strong>Saved progress couldn’t be read.</strong> It may have been damaged. Your current session will still work, but nothing new will be saved
        until you choose to start fresh. A backup copy of the old data is kept in this browser.
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => historyStore.startFreshAfterCorruption()}>
          Start fresh
        </button>
      </div>
    );
  }
  if (!snap.storageAvailable) {
    return (
      <div className="alert alert-warn" role="status">
        <strong>Progress can’t be saved in this browser</strong> (storage is disabled or in private mode). Everything still works, but your
        history will be lost when you close this page.
      </div>
    );
  }
  if (snap.saveError) {
    return <div className="alert alert-warn" role="status">{snap.saveError}</div>;
  }
  if (snap.loadIssue?.kind === 'partial') {
    return (
      <div className="alert alert-info" role="status">
        {snap.loadIssue.skipped} saved record{snap.loadIssue.skipped === 1 ? '' : 's'} couldn’t be read and {snap.loadIssue.skipped === 1 ? 'was' : 'were'} skipped. The rest of
        your progress loaded normally.
      </div>
    );
  }
  return null;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {intro && <p className="lead">{intro}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
