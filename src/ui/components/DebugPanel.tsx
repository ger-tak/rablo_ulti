import { useMemo, useState } from 'react';
import type { Card, EngineState } from '../../game';
import { trickWinner } from '../../game';

interface DebugPanelProps {
  state: EngineState;
  legalMoves: Card[];
}

export const DebugPanel = ({ state, legalMoves }: DebugPanelProps) => {
  const [open, setOpen] = useState(false);
  const prettyState = useMemo(() => JSON.stringify(state, null, 2), [state]);

  const winnerPreview = useMemo(() => {
    if (state.trick.plays.length !== 3) return null;
    try {
      return trickWinner(state);
    } catch {
      return null;
    }
  }, [state]);

  const copyState = async () => {
    try {
      await navigator.clipboard.writeText(prettyState);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <aside className={`debug-panel ${open ? 'open' : ''}`}>
      <header className="debug-header">
        <button type="button" className="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide Debug' : 'Debug'}
        </button>
        {open && (
          <button type="button" className="ghost" onClick={copyState}>
            Copy state to clipboard
          </button>
        )}
      </header>
      {open && (
        <div className="debug-body">
          <section className="debug-section">
            <h4>Legal moves (P{state.currentPlayer})</h4>
            <div className="pill-row">
              {legalMoves.length === 0 && <span className="pill muted">No moves</span>}
              {legalMoves.map((card, idx) => (
                <span key={`${card.suit}-${card.rank}-${idx}`} className="pill">
                  {card.rank} {card.suit}
                </span>
              ))}
            </div>
          </section>
          <section className="debug-section">
            <h4>State</h4>
            <pre className="debug-pre">{prettyState}</pre>
          </section>
          {winnerPreview !== null && (
            <section className="debug-section">
              <h4>Trick winner preview</h4>
              <div className="pill">P{winnerPreview}</div>
            </section>
          )}
        </div>
      )}
    </aside>
  );
};
