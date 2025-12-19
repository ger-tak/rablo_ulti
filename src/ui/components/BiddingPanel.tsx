import { BIDS } from '../../game';

interface BiddingPanelProps {
  currentPlayer: number;
  highestBidId?: string | undefined;
  onBid: (bidId: string) => void;
  onPass: () => void;
}

export const BiddingPanel = ({ currentPlayer, highestBidId, onBid, onPass }: BiddingPanelProps) => {
  const highestBid = highestBidId ? BIDS.find((b) => b.id === highestBidId) : undefined;
  const highestRank = highestBid ? highestBid.rank : -1;
  const highestName = highestBid ? highestBid.name : 'None yet';
  const nextBids = BIDS.filter((b) => b.id !== 'passz' && b.rank > highestRank);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Bidding</div>
        <div className="panel-subtitle">
          Current player: P{currentPlayer} • Highest bid: {highestName}
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
