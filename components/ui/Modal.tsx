'use client';
import { useEffect, type ReactNode } from 'react';

export function Modal({
  open, onClose, title, children, testId,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; testId?: string }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid={testId ?? 'modal'}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 560 }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 id="modal-title" style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <button onClick={onClose} data-testid="modal-close" aria-label="Fechar">✕</button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}