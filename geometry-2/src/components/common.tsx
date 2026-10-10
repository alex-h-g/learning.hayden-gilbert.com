import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { STATUS_LABEL, type Status } from '../lib/progress';
import { store, useStore } from '../lib/store';

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
        <button type="button" className="btn btn-secondary" onClick={onCancel} autoFocus>Cancel</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}

/** Deletes all saved progress in this browser, after confirmation. */
export function ResetProgressButton({ label = 'Delete saved progress' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => { setDone(false); setOpen(true); }}>
        ↺ {label}
      </button>
      <span role="status" className="reset-done">{done ? '✓ Progress deleted — starting fresh.' : ''}</span>
      <ConfirmDialog
        open={open}
        title="Delete all saved progress?"
        confirmLabel="Yes, delete it"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => { store.clear(); setOpen(false); setDone(true); }}
      >
        <p>This permanently deletes your name, stars, badges and every saved answer <strong>in this browser</strong>, so the next learner starts fresh. It can’t be undone.</p>
      </ConfirmDialog>
    </>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

const STATUS_ICON: Record<Status, string> = { 'not-started': '○', learning: '◔', practising: '◑', confident: '●' };

/** Status chip with a symbol as well as colour. */
export function StatusChip({ status }: { status: Status }) {
  return <span className={`chip chip-${status}`}><span aria-hidden="true">{STATUS_ICON[status]}</span> {STATUS_LABEL[status]}</span>;
}

export function StorageNotice() {
  const { available, saveError } = useStore();
  if (!available) return <div className="alert alert-warn" role="status"><strong>Progress can’t be saved in this browser</strong> (storage is turned off or in private mode). Everything still works, but your progress will be lost when you close the page.</div>;
  if (saveError) return <div className="alert alert-warn" role="status">Your browser’s storage is full, so the latest progress couldn’t be saved.</div>;
  return null;
}

export function Stars({ n }: { n: number }) {
  return <span className="stars" aria-label={`${n} stars`}><span aria-hidden="true">★</span> {n}</span>;
}
