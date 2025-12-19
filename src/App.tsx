import { useMemo, useState } from 'react';
import { legalMoves, newGame, playCard } from './game';
import type { Card, EngineState } from './game';
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
  const [messageLog, setMessageLog] = useState<string[]>([]);

  const handleNewGame = () => {
    const trimmed = seed.trim();
    const parsed = trimmed === '' ? undefined : Number.parseInt(trimmed, 10);
    const nextState = Number.isNaN(parsed) ? newGame() : newGame(parsed);
    setState(nextState);
    setMessageLog([]);
  };

  const legal = useMemo(
    () => legalMoves(state, state.currentPlayer),
    [state]
  );

  const legalKeySet = useMemo(() => new Set(legal.map((c) => `${c.suit}-${c.rank}`)), [legal]);

  const handlePlay = (card: Card) => {
    try {
      const nextState = playCard(state, state.currentPlayer, card);
      const playEntry = `P${state.currentPlayer} played ${card.rank} ${card.suit}`;
      const nextLog = nextState.log.includes(playEntry)
        ? nextState.log
        : [...nextState.log, playEntry];

      setState({ ...nextState, log: nextLog });
      setMessageLog((prev) => [...prev, playEntry]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Illegal action';
      setMessageLog((prev) => [...prev, message]);
    }
  };

  const hands = state.hands;
  const trick = state.trick;
  const log = [...state.log, ...messageLog];

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
              isCurrent={state.currentPlayer === 0}
              legalKeySet={legalKeySet}
              onPlay={handlePlay}
            />
          }
          left={
            <PlayerHand
              playerName="Player 1"
              cards={hands[1]}
              orientation="vertical"
              isCurrent={state.currentPlayer === 1}
              legalKeySet={legalKeySet}
              onPlay={handlePlay}
            />
          }
          right={
            <PlayerHand
              playerName="Player 2"
              cards={hands[2]}
              orientation="vertical"
              isCurrent={state.currentPlayer === 2}
              legalKeySet={legalKeySet}
              onPlay={handlePlay}
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
