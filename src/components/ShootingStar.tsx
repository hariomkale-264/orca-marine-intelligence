import React from 'react';

export const ShootingStar: React.FC = () => {
  return (
    <div className="shooting-star-container" aria-hidden="true">
      {/* Primary cinematic meteor */}
      <div className="shooting-star" style={{ top: '15%', left: '0%' }} />

      {/* Secondary faint distant meteor */}
      <div className="shooting-star-secondary" style={{ top: '35%', left: '15%' }} />
    </div>
  );
};
