import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingProcessor } from '../../visualizers/drawing-processor';

const Analysis = ({ analysisResult }) => {
  const [ocrResult, setOcrResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [deckList, setDeckList] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [exportFormat, setExportFormat] = useState('text');
  const processorRef = useRef(null);

  useEffect(() => {
    // Initialize DrawingProcessor with a mock card database
    const mockCardDatabase = {
      searchCard: (name) => ({ name, found: true }),
      fuzzySearch: (name, threshold = 0.8) => [
        { name: name, similarity: 0.9 },
        { name: name + ' Alternative', similarity: 0.7 }
      ]
    };

    processorRef.current = new DrawingProcessor(mockCardDatabase);
  }, []);

  useEffect(() => {
    if (analysisResult && analysisResult.uploadedFiles && processorRef.current) {
      processDrawings();
    }
  }, [analysisResult]);

  const processDrawings = async () => {
    if (!analysisResult?.uploadedFiles) return;

    setIsProcessing(true);
    setProcessingStep('Initializing OCR analysis...');

    try {
      for (const file of analysisResult.uploadedFiles) {
        if (file.type === 'blueprint' && file.url) {
          setProcessingStep('Loading blueprint image...');

          // Create image element from file URL
          const img = new Image();
          img.crossOrigin = 'anonymous';

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = file.url;
          });

          setProcessingStep('Performing OCR recognition...');

          // Process the drawing
          const result = await processorRef.current.processDrawing({
            type: 'image',
            data: img
          });

          setOcrResult(result);
          setDeckList(result.recognizedCards || []);
          setConfidence(result.overallConfidence || 0);
          setSuggestions(result.suggestions || []);

          setProcessingStep('OCR analysis complete!');
          break;
        }
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setProcessingStep('OCR analysis failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
      }, 1000);
    }
  };

  const exportDeckList = () => {
    if (!deckList.length) return;

    let content = '';

    switch (exportFormat) {
      case 'text':
        content = deckList.map(card => `${card.quantity || 1}x ${card.name}`).join('\n');
        break;
      case 'mtgo':
        content = deckList.map(card => `${card.quantity || 1} ${card.name}`).join('\n');
        break;
      case 'arena':
        content = deckList.map(card => `${card.quantity || 1} ${card.name} (${card.set || 'UNK'}) ${card.number || ''}`).join('\n');
        break;
      case 'json':
        content = JSON.stringify({ deckList, confidence, metadata: ocrResult }, null, 2);
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deck-list.${exportFormat === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      style={{
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ marginBottom: '2rem', textAlign: 'center' }}
      >
        Deck Blueprint Digitalizer
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          fontSize: '1.1rem',
          color: '#718096'
        }}
      >
        Advanced OCR technology converts your hand-drawn deck lists to digital format
      </motion.p>

      {/* Processing Status */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '300px'
            }}
          >
            <div className="loading" style={{ 
              fontSize: '2rem', 
              marginBottom: '1rem',
              color: '#667eea'
            }}>
              🔍
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2d3748' }}>
              {processingStep}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results */}
      {analysisResult && !isProcessing && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem', 
          width: '100%',
          maxWidth: '1000px'
        }}>

          {/* Traditional Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Deck Measurements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096' }}>Gross Living Area:</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>
                  {analysisResult.gross_living_area || 'N/A'} sq ft
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096' }}>Net Square Footage:</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>
                  {analysisResult.net_square_footage || 'N/A'} sq ft
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096' }}>Linear Railing:</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>
                  {analysisResult.linear_railing_footage || 'N/A'} ft
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096' }}>Stair Cutouts:</span>
                <span style={{ fontWeight: '600', color: '#2d3748' }}>
                  {analysisResult.stair_cutouts || 'N/A'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* OCR Results */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>OCR Recognition</h3>

            {deckList.length > 0 ? (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{ color: '#718096' }}>Confidence:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '100px',
                      height: '8px',
                      background: 'rgba(102, 126, 234, 0.2)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${confidence * 100}%`,
                        height: '100%',
                        background: confidence > 0.8 ? '#48bb78' : confidence > 0.6 ? '#ed8936' : '#e53e3e',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <span style={{ fontWeight: '600', color: '#2d3748' }}>
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ color: '#718096' }}>Cards Detected: </span>
                  <span style={{ fontWeight: '600', color: '#2d3748' }}>
                    {deckList.length}
                  </span>
                </div>

                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  background: 'rgba(248, 250, 252, 0.8)',
                  borderRadius: '8px'
                }}>
                  {deckList.slice(0, 10).map((card, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '0.25rem 0',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ color: '#2d3748' }}>{card.name}</span>
                      <span style={{ color: '#718096' }}>{card.quantity || 1}x</span>
                    </div>
                  ))}
                  {deckList.length > 10 && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#718096', 
                      fontSize: '0.8rem',
                      marginTop: '0.5rem'
                    }}>
                      +{deckList.length - 10} more cards
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <select 
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      background: 'white',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="text">Plain Text</option>
                    <option value="mtgo">MTGO Format</option>
                    <option value="arena">Arena Format</option>
                    <option value="json">JSON Export</option>
                  </select>

                  <button
                    onClick={exportDeckList}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Export
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: '#718096', textAlign: 'center' }}>
                {analysisResult ? 'No cards detected in the uploaded blueprint.' : 'Upload a blueprint to begin OCR analysis.'}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            marginTop: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '600px'
          }}
        >
          <h4 style={{ marginBottom: '1rem', color: '#2d3748' }}>Suggestions</h4>
          <div style={{ fontSize: '0.9rem', color: '#718096' }}>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                • {suggestion}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!analysisResult && !isProcessing && (
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{ 
            textAlign: 'center',
            fontSize: '1.1rem',
            color: '#a0aec0'
          }}
        >
          Upload your deck blueprints to begin analysis...
        </motion.p>
      )}
    </motion.div>
  );
};

export default Analysis;
