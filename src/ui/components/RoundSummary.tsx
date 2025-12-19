import { getBidById, type ScoreBreakdown } from '../../game';

interface RoundSummaryProps {
  score: ScoreBreakdown;
  onNextRound: () => void;
}

export const RoundSummary = ({ score, onNextRound }: RoundSummaryProps) => {
  const bid = getBidById(score.bidId);
  const payoutEntries = Object.entries(score.payouts);
  const silentEntries = [
    {
      key: 'silent100',
      label: 'Silent 100',
      eligible: score.silent.eligible.silent100,
      achieved: score.silent.achieved.silent100
    },
    {
      key: 'silentUlti',
      label: 'Silent Ulti',
      eligible: score.silent.eligible.silentUlti,
      achieved: score.silent.achieved.silentUlti
    },
    {
      key: 'silentDurchmarsch',
      label: 'Silent Durchmarsch',
      eligible: score.silent.eligible.silentDurchmarsch,
      achieved: score.silent.achieved.silentDurchmarsch
    }
  ];

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
            <strong>Silent points:</strong> Bidder {score.silent.pointsBidder}
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
          <div className="summary-row">
            <strong>Silent bonuses:</strong>
            <ul>
              {silentEntries.map((entry) => (
                <li key={entry.key} style={{ fontWeight: entry.achieved ? 'bold' : undefined }}>
                  {entry.label}: {entry.eligible !== null ? `${entry.eligible} points` : 'Not eligible'} (
                  {entry.achieved ? 'achieved' : 'not achieved'})
                </li>
              ))}
            </ul>
          </div>
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
