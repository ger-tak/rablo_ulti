interface ToolbarProps {
  seed: string;
  phase: string;
  onSeedChange: (seed: string) => void;
  onNewGame: () => void;
}

export const Toolbar = ({ seed, phase, onSeedChange, onNewGame }: ToolbarProps) => (
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
    </div>
  </div>
);
