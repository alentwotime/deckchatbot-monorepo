import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Introduction from './components/Stage1_Introduction/Introduction';
import Upload from './components/Stage2_Upload/Upload';
import Analysis from './components/Stage3_Analysis/Analysis';
import Blueprint from './components/Stage4_Blueprint/Blueprint';
import ModelViewer from './components/Stage5_3DModel/ModelViewer';
import Chatbox from './components/Chatbox/Chatbox';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const { scrollY } = useScroll();
  const chatboxX = useTransform(scrollY, [0, 500], ['0%', '-50%']); // Example transformation

  return (
    <div className="App">
      <motion.div style={{ x: chatboxX }}>
        <Chatbox />
      </motion.div>
      <Introduction />
      <Upload setAnalysisResult={setAnalysisResult} />
      <Analysis analysisResult={analysisResult} />
      <Blueprint analysisResult={analysisResult} />
      <ModelViewer analysisResult={analysisResult} />
    </div>
  );
}

export default App;
