import { useMemo } from 'react';

interface GameLogProps {
  log: string[];
  debugState?: Record<string, unknown>;
  open: boolean;
  onToggle: () => void;
}

export const GameLog = ({ log, debugState, open, onToggle }: GameLogProps) => {
  const debugLines = useMemo(() => {
    if (!debugState) return [];
    return Object.entries(debugState).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  }, [debugState]);

  return (
    <aside className={`log-panel ${open ? 'open' : ''}`}>
      <header className="log-header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onToggle()}>
        <span>Log</span>
        <span className="log-toggle">{open ? '▼' : '▲'}</span>
      </header>
      {open && (
        <div className="log-body">
          <ul className="log-list">
            {log.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
          {debugLines.length > 0 && (
            <>
              <div className="log-divider" />
              <div className="log-debug">
                <div className="log-debug-title">Debug</div>
                <ul>
                  {debugLines.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
