import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { generateBlueprint } from '../../../services/backend.service.js';

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
          // Sanitize SVG content to prevent XSS attacks
          const sanitizedSVG = DOMPurify.sanitize(bp.svg || bp.blueprint, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ALLOWED_TAGS: [
              'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
              'polygon', 'text', 'tspan', 'defs', 'marker', 'pattern', 'clipPath',
              'mask', 'image', 'desc', 'title'
            ],
            ALLOWED_ATTR: [
              'width', 'height', 'viewBox', 'xmlns', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
              'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'transform',
              'font-family', 'font-size', 'font-weight', 'text-anchor', 'd', 'points',
              'x1', 'y1', 'x2', 'y2', 'id', 'class'
            ],
            FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
            FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'style']
          });
          setBlueprint(sanitizedSVG);
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
    <motion.div 
      style={{ height: '100vh', border: '1px solid #ccc', padding: '20px', margin: '10px' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
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
    </motion.div>
  );
};

export default Blueprint;
