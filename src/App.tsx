import { useState } from 'react';
import type { Card } from './game/types';
import { GameLog } from './ui/components/GameLog';
import { PlayerHand } from './ui/components/PlayerHand';
import { TableLayout } from './ui/components/TableLayout';
import { Toolbar } from './ui/components/Toolbar';
import { TrickArea } from './ui/components/TrickArea';
import './App.css';
import './ui/styles.css';

const demoHand = (cards: Card[]): Card[] => cards;

const demoData = {
  players: [
    { id: 0, name: 'You', hand: demoHand([
      { suit: 'piros', rank: 'A' },
      { suit: 'piros', rank: 'K' },
      { suit: 'piros', rank: '10' },
      { suit: 'tok', rank: 'Felső' },
      { suit: 'tok', rank: '9' },
      { suit: 'zold', rank: 'Alsó' },
      { suit: 'makk', rank: '8' },
      { suit: 'makk', rank: '7' }
    ]) },
    { id: 1, name: 'Player 1', hand: demoHand([
      { suit: 'makk', rank: 'A' },
      { suit: 'makk', rank: 'K' },
      { suit: 'piros', rank: '8' },
      { suit: 'piros', rank: '9' },
      { suit: 'tok', rank: '10' }
    ]) },
    { id: 2, name: 'Player 2', hand: demoHand([
      { suit: 'zold', rank: 'A' },
      { suit: 'zold', rank: '10' },
      { suit: 'tok', rank: 'K' },
      { suit: 'tok', rank: 'Alsó' },
      { suit: 'piros', rank: '7' }
    ]) }
  ],
  trick: {
    leader: 1,
    plays: [
      { player: 1, card: { suit: 'makk', rank: 'A' } },
      { player: 2, card: { suit: 'makk', rank: 'K' } }
    ]
  },
  log: [
    'New game created',
    'Player 1 leads makk A',
    'Player 2 follows with makk K'
  ],
  phase: 'PLAY' as const
};

function App() {
  const [seed, setSeed] = useState('12345');
  const [logOpen, setLogOpen] = useState(false);

  const handleNewGame = () => {
    // TODO: wire to engine once available
    // For now just refresh demo seed
    setSeed(String(Math.floor(Math.random() * 100000)));
  };

  return (
    <div className="page">
      <Toolbar
        phase={demoData.phase}
        seed={seed}
        onSeedChange={setSeed}
        onNewGame={handleNewGame}
      />

      <div className="layout">
        <TableLayout
          bottom={
            <PlayerHand
              playerName={demoData.players[0].name}
              cards={demoData.players[0].hand}
              orientation="horizontal"
            />
          }
          left={
            <PlayerHand
              playerName={demoData.players[1].name}
              cards={demoData.players[1].hand}
              orientation="vertical"
            />
          }
          right={
            <PlayerHand
              playerName={demoData.players[2].name}
              cards={demoData.players[2].hand}
              orientation="vertical"
            />
          }
          center={
            <TrickArea
              leader={demoData.trick.leader}
              plays={demoData.trick.plays}
            />
          }
        />

        <GameLog
          log={demoData.log}
          debugState={{ phase: demoData.phase, leader: demoData.trick.leader }}
          open={logOpen}
          onToggle={() => setLogOpen((v) => !v)}
        />
      </div>
    </div>
  );
}

export default App;
