import type { Card, PlayerId, TrickPlay } from '../../game/types';

interface TrickAreaProps {
  leader: PlayerId;
  plays: TrickPlay[];
}

export const TrickArea = ({ plays }: TrickAreaProps) => (
  <div className="trick-area">
    <h3>Current Trick</h3>
    <div className="trick-cards">
      {plays.map((play) => (
        <div key={`${play.player}-${play.card.suit}-${play.card.rank}`} className="trick-card">
          <div className="trick-player">P{play.player}</div>
          <div className="card card-sm">
            <span className="card-rank">{play.card.rank}</span>
            <span className="card-suit">{play.card.suit}</span>
          </div>
        </div>
      ))}
      {plays.length === 0 && <div className="trick-empty">No cards played</div>}
    </div>
  </div>
);
