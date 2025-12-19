import type { ReactNode } from 'react';

interface TableLayoutProps {
  bottom: ReactNode;
  left: ReactNode;
  right: ReactNode;
  center: ReactNode;
}

export const TableLayout = ({ bottom, left, right, center }: TableLayoutProps) => (
  <div className="table">
    <div className="seat seat-left">{left}</div>
    <div className="center-area">
      {center}
    </div>
    <div className="seat seat-right">{right}</div>
    <div className="seat seat-bottom">{bottom}</div>
  </div>
);
