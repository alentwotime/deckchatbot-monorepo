import React from 'react';

const Analysis = ({ analysisResult }) => {
  return (
    <div style={{ height: '100vh', border: '1px solid #ccc', padding: '20px', margin: '10px' }}>
      <h2>Stage 3: Deck Measurements & Analysis</h2>
      {analysisResult ? (
        <div>
          <p>Gross Living Area: {analysisResult.gross_living_area} sq ft</p>
          <p>Net Square Footage: {analysisResult.net_square_footage} sq ft</p>
          <p>Linear Railing Footage: {analysisResult.linear_railing_footage} ft</p>
          <p>Stair Cutouts: {analysisResult.stair_cutouts}</p>
        </div>
      ) : (
        <p>Awaiting analysis...</p>
      )}
    </div>
  );
};

export default Analysis;
