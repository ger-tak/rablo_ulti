interface ToolbarProps {
  seed: string;
  phase: string;
  leader: number;
  currentPlayer: number;
  balances: Record<number, number>;
  onSeedChange: (seed: string) => void;
  onNewGame: () => void;
}

export const Toolbar = ({ seed, phase, leader, currentPlayer, balances, onSeedChange, onNewGame }: ToolbarProps) => (
  <div className="toolbar">
    <div className="toolbar-left">
      <button type="button" className="primary" onClick={onNewGame}>
        New Game
      </button>
      <div className="field">
        <label htmlFor="seed">Seed</label>
        <input
          id="seed"
          value={seed}
          onChange={(e) => onSeedChange(e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
    <div className="toolbar-right">
      <span className="phase-chip">{phase}</span>
      <span className="info-chip">Leader: P{leader}</span>
      <span className="info-chip">Current: P{currentPlayer}</span>
      <span className="info-chip balances">
        Balances:
        {[0, 1, 2].map((pid) => (
          <span key={pid} className="balance-chip">
            P{pid}: {balances[pid] ?? 0}
          </span>
        ))}
      </span>
    </div>
  </div>
);
