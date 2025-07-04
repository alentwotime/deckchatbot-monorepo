import React, { useState, useEffect } from 'react';
import { useScroll, motion, useSpring, useTransform } from 'framer-motion';
import Introduction from './components/Stage1_Introduction/Introduction';
import Upload from './components/Stage2_Upload/Upload';
import Analysis from './components/Stage3_Analysis/Analysis';
import Blueprint from './components/Stage4_Blueprint/Blueprint';
import EnhancedModelViewer from './components/Stage5_3DModel/EnhancedModelViewer';
import Chatbox from './components/Chatbox/Chatbox';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="App">
      {/* Scroll Progress Indicator */}
      <motion.div 
        className="scroll-indicator"
        style={{ scaleX }}
      />

      {/* Navigation Dots */}
      <motion.nav 
        className="nav-dots"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        style={{
          position: 'fixed',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {['Introduction', 'Upload', 'Analysis', 'Blueprint', '3D Model'].map((section, index) => (
          <motion.button
            key={section}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const element = document.getElementById(`section-${index + 1}`);
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '2px solid rgba(102, 126, 234, 0.6)',
              background: 'rgba(102, 126, 234, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            title={section}
          />
        ))}
      </motion.nav>

      <Chatbox />

      <div id="section-1">
        <Introduction />
      </div>

      <div id="section-2">
        <Upload setAnalysisResult={setAnalysisResult} />
      </div>

      <div id="section-3">
        <Analysis analysisResult={analysisResult} />
      </div>

      <div id="section-4">
        <Blueprint analysisResult={analysisResult} />
      </div>

      <div id="section-5">
        <EnhancedModelViewer analysisResult={analysisResult} />
      </div>
    </div>
  );
}

export default App;
