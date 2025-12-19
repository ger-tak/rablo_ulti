import { useEffect, useMemo, useState } from 'react';
import {
  engineLegalMoves,
  newGame,
  playCard,
  bid,
  passBid,
  declareTrump,
  discardToTalon,
  takeTalon,
  declineTalon,
  announceBela,
  callKontra,
  nextRound
} from './game';
import type { Card, EngineState } from './game';
import { GameLog } from './ui/components/GameLog';
import { PlayerHand } from './ui/components/PlayerHand';
import { TableLayout } from './ui/components/TableLayout';
import { Toolbar } from './ui/components/Toolbar';
import { TrickArea } from './ui/components/TrickArea';
import { DebugPanel } from './ui/components/DebugPanel';
import { BiddingPanel } from './ui/components/BiddingPanel';
import { RoundSummary } from './ui/components/RoundSummary';
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
    () => engineLegalMoves(state, state.currentPlayer),
    [state]
  );

  const legalKeySet = useMemo(() => new Set(legal.map((c) => `${c.suit}-${c.rank}`)), [legal]);

  const handlePlay = (card: Card) => {
    try {
      const nextState = playCard(state, state.currentPlayer, card);
      const playEntry = `P${state.currentPlayer} played ${card.rank} ${card.suit}`;
      const trickJustEnded = state.trick.plays.length === 2 && nextState.trick.plays.length === 0;
      const winnerEntry =
        trickJustEnded && nextState.leader !== state.leader
          ? `Trick won by P${nextState.leader}`
          : null;

      let nextLog = nextState.log.includes(playEntry) ? nextState.log : [...nextState.log, playEntry];
      if (winnerEntry && !nextLog.includes(winnerEntry)) {
        nextLog = [...nextLog, winnerEntry];
      }

      setState({ ...nextState, log: nextLog });
      setMessageLog((prev) => [...prev, playEntry, ...(winnerEntry ? [winnerEntry] : [])]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Illegal action';
      setMessageLog((prev) => [...prev, message]);
    }
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (state.trick.plays.length === 3) return;
      if (state.phase !== 'PLAY') return;
      const index = Number.parseInt(event.key, 10);
      if (!Number.isInteger(index)) return;
      if (index < 1 || index > legal.length) return;
      const selected = legal[index - 1];
      handlePlay(selected);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [legal, state, handlePlay]);

  const sortOrder = useMemo(() => {
    const rankOrderTrump: Card['rank'][] = ['A', '10', 'K', 'Felső', 'Alsó', '9', '8', '7'];
    const rankOrderNoTrump: Card['rank'][] = ['A', 'K', 'Felső', 'Alsó', '10', '9', '8', '7'];
    const rankMap = (state.gameType === 'TRUMP' ? rankOrderTrump : rankOrderNoTrump).reduce(
      (acc, rank, idx) => ({ ...acc, [rank]: idx }),
      {} as Record<Card['rank'], number>
    );
    const suitOrder: Card['suit'][] = ['makk', 'tok', 'zold', 'piros'];
    const suitMap = suitOrder.reduce(
      (acc, suit, idx) => ({ ...acc, [suit]: idx }),
      {} as Record<Card['suit'], number>
    );
    return { rankMap, suitMap };
  }, [state.gameType]);

  const sortHand = (hand: Card[]) =>
    [...hand].sort((a, b) => {
      const suitDiff = sortOrder.suitMap[a.suit] - sortOrder.suitMap[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return sortOrder.rankMap[a.rank] - sortOrder.rankMap[b.rank];
    });

  const hands = {
    ...state.hands,
    0: sortHand(state.hands[0])
  };
  const trick = state.trick;
  const log = [...state.log, ...messageLog];

  const handleBid = (bidId: string) => {
    try {
      const next = bid(state, state.currentPlayer, bidId);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bid failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handlePass = () => {
    try {
      const next = passBid(state, state.currentPlayer);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pass failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleTakeTalon = () => {
    try {
      const next = takeTalon(state, state.currentPlayer);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Talon take failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleDeclineTalon = () => {
    try {
      const next = declineTalon(state, state.currentPlayer);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Decline talon failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleDeclareTrump = (suit: Card['suit']) => {
    try {
      const next = declareTrump(state, state.currentPlayer, suit);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Declare trump failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleDiscardToTalon = (cards: Card[]) => {
    try {
      const next = discardToTalon(state, state.currentPlayer, cards);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Discard failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleAnnounceBela = (suit: Card['suit']) => {
    try {
      const next = announceBela(state, state.currentPlayer, suit);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Béla announcement failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleCallKontra = () => {
    try {
      const next = callKontra(state, state.currentPlayer);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kontra failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const handleNextRound = () => {
    try {
      const next = nextRound(state);
      setState(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Next round failed';
      setMessageLog((prev) => [...prev, msg]);
    }
  };

  const overlay = (() => {
    if (state.phase === 'ROUND_END' && state.lastScore) {
      return (
        <RoundSummary
          score={state.lastScore}
          onNextRound={handleNextRound}
        />
      );
    }
    if (state.phase === 'BID') {
      return (
        <div className="overlay">
          <BiddingPanel
            currentPlayer={state.currentPlayer}
            highestBidId={state.highestBidId}
            highestBidder={state.highestBidder}
            bidNeedsDiscard={state.bidNeedsDiscard}
            bidAwaitingTalonDecision={state.bidAwaitingTalonDecision}
            requireRaiseAfterTake={state.requireRaiseAfterTake}
            hand={hands[state.currentPlayer]}
            onBid={handleBid}
            onPass={handlePass}
            onDiscard={handleDiscardToTalon}
            onTakeTalon={handleTakeTalon}
            onDeclineTalon={handleDeclineTalon}
          />
        </div>
      );
    }
    if (state.phase === 'DECLARE_TRUMP') {
      return (
        <div className="overlay">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Declare Trump</div>
              <div className="panel-subtitle">Player {state.currentPlayer}</div>
            </div>
            <div className="panel-body pill-row">
              {(['makk', 'tok', 'zold', 'piros'] as Card['suit'][]).map((suit) => (
                <button
                  key={suit}
                  type="button"
                  className="secondary"
                  onClick={() => handleDeclareTrump(suit)}
                >
                  {suit}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  })();

  const eligibleBelaSuits = useMemo(() => {
    if (
      state.phase !== 'PLAY' ||
      state.trickIndex !== 0 ||
      state.currentPlayer === undefined ||
      state.gameType !== 'TRUMP'
    ) {
      return [];
    }

    const hand = state.hands[state.currentPlayer] ?? [];
    const announced = state.belaAnnouncements.filter((ann) => ann.player === state.currentPlayer);
    const suits: Card['suit'][] = ['makk', 'tok', 'zold', 'piros'];
    return suits.filter((suit) => {
      const hasKing = hand.some((c) => c.suit === suit && c.rank === 'K');
      const hasQueen = hand.some((c) => c.suit === suit && c.rank === 'Felső');
      const already = announced.some((ann) => ann.suit === suit);
      return hasKing && hasQueen && !already;
    });
  }, [state]);

  const canCallKontra =
    state.phase === 'PLAY' && state.trickIndex === 0 && state.trick.plays.length === 0;

  return (
    <div className="page">
      <Toolbar
        phase={state.phase}
        seed={seed}
        leader={state.leader}
        currentPlayer={state.currentPlayer}
        balances={state.balances}
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
              isCurrent={state.phase === 'PLAY' && state.currentPlayer === 0}
              legalKeySet={state.phase === 'PLAY' ? legalKeySet : undefined}
              onPlay={state.phase === 'PLAY' ? handlePlay : undefined}
            />
          }
          left={
            <PlayerHand
              playerName="Player 1"
              cards={hands[1]}
              orientation="vertical"
              isCurrent={state.phase === 'PLAY' && state.currentPlayer === 1}
              legalKeySet={state.phase === 'PLAY' ? legalKeySet : undefined}
              onPlay={state.phase === 'PLAY' ? handlePlay : undefined}
            />
          }
          right={
            <PlayerHand
              playerName="Player 2"
              cards={hands[2]}
              orientation="vertical"
              isCurrent={state.phase === 'PLAY' && state.currentPlayer === 2}
              legalKeySet={state.phase === 'PLAY' ? legalKeySet : undefined}
              onPlay={state.phase === 'PLAY' ? handlePlay : undefined}
            />
          }
          center={
            <TrickArea
              leader={trick.leader}
              plays={trick.plays}
            />
          }
        />

        <div className="side-panels">
          <GameLog
            log={log}
            debugState={{ phase: state.phase, leader: state.leader, currentPlayer: state.currentPlayer }}
            open={logOpen}
            onToggle={() => setLogOpen((v) => !v)}
          />
          <DebugPanel state={state} legalMoves={legal} />
        </div>
      </div>

      {state.phase === 'PLAY' && (
        <div className="action-bar">
          {eligibleBelaSuits.length > 0 && (
            <div className="action-group">
              <span>Announce Béla:</span>
              {eligibleBelaSuits.map((suit) => (
                <button
                  key={suit}
                  type="button"
                  className="secondary"
                  onClick={() => handleAnnounceBela(suit)}
                >
                  {suit}
                </button>
              ))}
            </div>
          )}
          {canCallKontra && (
            <div className="action-group">
              <span>Kontra:</span>
              <button type="button" className="secondary" onClick={handleCallKontra}>
                Call
              </button>
            </div>
          )}
        </div>
      )}

      {overlay}
    </div>
  );
}

export default App;
