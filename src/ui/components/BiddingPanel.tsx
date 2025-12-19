import { BIDS } from '../../game';

interface BiddingPanelProps {
  currentPlayer: number;
  highestBidId?: string;
  onBid: (bidId: string) => void;
  onPass: () => void;
}

export const BiddingPanel = ({ currentPlayer, highestBidId, onBid, onPass }: BiddingPanelProps) => {
  const highestRank = highestBidId ? (BIDS.find((b) => b.id === highestBidId)?.rank ?? -1) : -1;
  const highestName = highestBidId ? (BIDS.find((b) => b.id === highestBidId)?.name ?? '') : '';
  const nextBids = BIDS.filter((b) => b.rank > highestRank && b.id !== 'passz');

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Bidding - Player {currentPlayer}</div>
        <div className="panel-subtitle">
          Current highest: {highestName || 'None yet'}
        </div>
      </div>
      <div className="panel-body">
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
      </div>
    </div>
  );
};
