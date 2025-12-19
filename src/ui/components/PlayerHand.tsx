import type { Card } from '../../game/types';

interface PlayerHandProps {
  playerName: string;
  cards: Card[];
  orientation?: 'horizontal' | 'vertical';
  isCurrent?: boolean | undefined;
  legalKeySet?: Set<string> | undefined;
  onPlay?: ((card: Card) => void) | undefined;
}

export const PlayerHand = ({
  playerName,
  cards,
  orientation = 'horizontal',
  isCurrent = false,
  legalKeySet,
  onPlay
}: PlayerHandProps) => {
  if (!isCurrent) {
    return (
      <div className={`hand hand-${orientation}`}>
        <div className="hand-header">{playerName}</div>
        <div className="hand-cards backs">
          <div className="card card-back">Cards: {cards.length}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hand hand-${orientation}`}>
      <div className="hand-header">{playerName}</div>
      <div className="hand-cards">
        {cards.map((card, index) => {
          const key = `${card.suit}-${card.rank}`;
          const isLegal = legalKeySet ? legalKeySet.has(key) : false;
          return (
            <button
              type="button"
              key={`${card.suit}-${card.rank}-${index}`}
              className={`card ${isLegal ? 'card-legal' : 'card-disabled'}`}
              disabled={!isLegal}
              aria-disabled={!isLegal}
              onClick={() => isLegal && onPlay?.(card)}
            >
              <span className="card-rank">{card.rank}</span>
              <span className="card-suit">{card.suit}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
