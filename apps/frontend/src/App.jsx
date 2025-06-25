import React, { useState, useEffect } from 'react';
import { useScroll } from 'framer-motion';
import Introduction from './components/Stage1_Introduction/Introduction';
import Upload from './components/Stage2_Upload/Upload';
import Analysis from './components/Stage3_Analysis/Analysis';
import Blueprint from './components/Stage4_Blueprint/Blueprint';
import ModelViewer from './components/Stage5_3DModel/ModelViewer';
import Chatbox from './components/Chatbox/Chatbox';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  useScroll(); // initialize scroll to enable Chatbox docking logic

  return (
    <div className="App">
      <Chatbox />
      <Introduction />
      <Upload setAnalysisResult={setAnalysisResult} />
      <Analysis analysisResult={analysisResult} />
      <Blueprint analysisResult={analysisResult} />
      <ModelViewer analysisResult={analysisResult} />
    </div>
  );
}

export default App;
