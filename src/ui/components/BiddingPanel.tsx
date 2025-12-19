import { useEffect, useMemo, useState } from 'react';
import { BIDS, type Card } from '../../game';

interface BiddingPanelProps {
  currentPlayer: number;
  highestBidId?: string | undefined;
  bidNeedsDiscard: boolean;
  hand: Card[];
  onBid: (bidId: string) => void;
  onPass: () => void;
  onDiscard: (cards: Card[]) => void;
}

export const BiddingPanel = ({
  currentPlayer,
  highestBidId,
  bidNeedsDiscard,
  hand,
  onBid,
  onPass,
  onDiscard
}: BiddingPanelProps) => {
  const highestBid = highestBidId ? BIDS.find((b) => b.id === highestBidId) : undefined;
  const highestRank = highestBid ? highestBid.rank : -1;
  const highestName = highestBid ? highestBid.name : 'None yet';
  const nextBids = BIDS.filter((b) => b.id !== 'passz' && b.rank > highestRank);

  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [hand, bidNeedsDiscard]);

  const selectedCards = useMemo(() => selected.map((idx) => hand[idx]), [selected, hand]);

  const toggleCard = (idx: number) => {
    setSelected((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= 2) return prev;
      return [...prev, idx];
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Bidding</div>
        <div className="panel-subtitle">
          Current player: P{currentPlayer} • Highest bid: {highestName}
        </div>
      </div>
      <div className="panel-body">
        {bidNeedsDiscard ? (
          <>
            <div className="pill muted">Discard 2 cards to the talon before bidding</div>
            <div className="pill-row">
              {hand.map((card, idx) => {
                const isSelected = selected.includes(idx);
                return (
                  <button
                    type="button"
                    key={`${card.suit}-${card.rank}-${idx}`}
                    className={isSelected ? 'primary' : 'secondary'}
                    onClick={() => toggleCard(idx)}
                  >
                    {card.rank} {card.suit}
                  </button>
                );
              })}
            </div>
            <div className="panel-actions">
              <button
                type="button"
                className="primary"
                onClick={() => onDiscard(selectedCards)}
                disabled={selectedCards.length !== 2}
              >
                Put to Talon
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="pill-row">
              {nextBids.map((bid) => (
                <button
                  type="button"
                  key={bid.id}
                  className="secondary"
                  onClick={() => onBid(bid.id)}
                >
                  {bid.name}
                </button>
              ))}
              {nextBids.length === 0 && <span className="pill muted">No higher bids</span>}
            </div>
            <div className="panel-actions">
              <button type="button" className="primary" onClick={onPass}>
                Pass
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
