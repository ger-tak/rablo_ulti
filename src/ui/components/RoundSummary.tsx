import { getBidById, type ScoreBreakdown } from '../../game';

interface RoundSummaryProps {
  score: ScoreBreakdown;
  onNextRound: () => void;
}

export const RoundSummary = ({ score, onNextRound }: RoundSummaryProps) => {
  const bid = getBidById(score.bidId);
  const payoutEntries = Object.entries(score.payouts);

  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Round Summary</div>
          <div className="panel-subtitle">{bid?.name ?? score.bidId}</div>
        </div>
        <div className="panel-body">
          <div className="summary-row">
            <strong>Bidder:</strong> P{score.bidder}
          </div>
          <div className="summary-row">
            <strong>Contract:</strong> {score.contractSuccess ? 'Success' : 'Failed'}
          </div>
          <div className="summary-row">
            <strong>Trick points:</strong> Bidder {score.trickPointsBidder} / Defenders {score.trickPointsDefenders}
          </div>
          <div className="summary-row">
            <strong>Béla points:</strong> Bidder {score.belaPointsBidder} / Defenders {score.belaPointsDefenders}
          </div>
          <div className="summary-row">
            <strong>Payouts:</strong>
            <ul>
              {payoutEntries.map(([pid, amount]) => (
                <li key={pid}>
                  P{pid}: {amount}
                </li>
              ))}
            </ul>
          </div>
          {score.notes.length > 0 && (
            <div className="summary-row">
              <strong>Notes:</strong>
              <ul>
                {score.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          {score.silentBonuses && score.silentBonuses.length > 0 && (
            <div className="summary-row">
              <strong>Silent bonuses:</strong>
              <ul>
                {score.silentBonuses.map((bonus) => (
                  <li key={bonus.name}>
                    {bonus.name}: +{bonus.points}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="panel-footer">
          <button type="button" className="primary" onClick={onNextRound}>
            Next round
          </button>
        </div>
      </div>
    </div>
  );
};
