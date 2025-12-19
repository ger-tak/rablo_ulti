import { useState } from 'react';
import { newGame } from './game';
import type { EngineState, PlayerId } from './game';
import { GameLog } from './ui/components/GameLog';
import { PlayerHand } from './ui/components/PlayerHand';
import { TableLayout } from './ui/components/TableLayout';
import { Toolbar } from './ui/components/Toolbar';
import { TrickArea } from './ui/components/TrickArea';
import './App.css';
import './ui/styles.css';

function App() {
  const [seed, setSeed] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [state, setState] = useState<EngineState>(() => newGame());

  const handleNewGame = () => {
    const trimmed = seed.trim();
    const parsed = trimmed === '' ? undefined : Number.parseInt(trimmed, 10);
    const nextState = Number.isNaN(parsed) ? newGame() : newGame(parsed);
    setState(nextState);
  };

  const hands = state.hands;
  const trick = state.trick;
  const log = state.log;

  return (
    <div className="page">
      <Toolbar
        phase={state.phase}
        seed={seed}
        leader={state.leader}
        currentPlayer={state.currentPlayer}
        onSeedChange={setSeed}
        onNewGame={handleNewGame}
      />

      <div className="layout">
        <TableLayout
          bottom={
            <PlayerHand
              playerName="You"
              cards={hands[0]}
              orientation="horizontal"
            />
          }
          left={
            <PlayerHand
              playerName="Player 1"
              cards={hands[1]}
              orientation="vertical"
            />
          }
          right={
            <PlayerHand
              playerName="Player 2"
              cards={hands[2]}
              orientation="vertical"
            />
          }
          center={
            <TrickArea
              leader={trick.leader}
              plays={trick.plays}
            />
          }
        />

        <GameLog
          log={log}
          debugState={{ phase: state.phase, leader: state.leader, currentPlayer: state.currentPlayer }}
          open={logOpen}
          onToggle={() => setLogOpen((v) => !v)}
        />
      </div>
    </div>
  );
}

export default App;
