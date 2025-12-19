import type { Card } from '../../game/types';

interface PlayerHandProps {
  playerName: string;
  cards: Card[];
  orientation?: 'horizontal' | 'vertical';
}

export const PlayerHand = ({ playerName, cards, orientation = 'horizontal' }: PlayerHandProps) => (
  <div className={`hand hand-${orientation}`}>
    <div className="hand-header">{playerName}</div>
    <div className="hand-cards">
      {cards.map((card, index) => (
        <button
          type="button"
          key={`${card.suit}-${card.rank}-${index}`}
          className="card"
          onClick={() => {
            // TODO: wire to engine actions
          }}
        >
          <span className="card-rank">{card.rank}</span>
          <span className="card-suit">{card.suit}</span>
        </button>
      ))}
    </div>
  </div>
);
