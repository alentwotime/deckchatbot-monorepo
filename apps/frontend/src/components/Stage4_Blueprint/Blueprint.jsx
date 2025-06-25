import React, { useState, useEffect } from 'react';
import { generateBlueprint } from '../../services/backend.service';

const Blueprint = ({ analysisResult }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (analysisResult) {
      const fetchBlueprint = async () => {
        setLoading(true);
        setError('');
        try {
          const bp = await generateBlueprint(analysisResult);
          setBlueprint(bp.svg);
        } catch (err) {
          setError('Failed to generate blueprint. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchBlueprint();
    }
  }, [analysisResult]);

  return (
    <div style={{ height: '100vh', border: '1px solid #ccc', padding: '20px', margin: '10px' }}>
      <h2>Stage 4: Your Digital Blueprint</h2>
      {loading && <p>Generating blueprint...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {blueprint && !loading && !error && (
        <div>
          <div dangerouslySetInnerHTML={{ __html: blueprint }} style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
          <div>
            <button>Download PDF</button>
            <button>Download JPEG</button>
            <button>Download SVG</button>
          </div>
        </div>
      )}
      {!analysisResult && !loading && <p>Awaiting analysis to generate blueprint...</p>}
    </div>
  );
};

export default Blueprint;
