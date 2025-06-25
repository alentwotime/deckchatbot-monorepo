import React, { useState, useEffect } from 'react';
import Introduction from './components/Stage1_Introduction/Introduction';
import Upload from './components/Stage2_Upload/Upload';
import Analysis from './components/Stage3_Analysis/Analysis';
import Blueprint from './components/Stage4_Blueprint/Blueprint';
import ModelViewer from './components/Stage5_3DModel/ModelViewer';
import Chatbox from './components/Chatbox/Chatbox';
import './App.css';

function App() {
  const [isShrunk, setIsShrunk] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="App">
      <Introduction />
      <Upload setAnalysisResult={setAnalysisResult} />
      <Analysis analysisResult={analysisResult} />
      <Blueprint analysisResult={analysisResult} />
      <ModelViewer />
      <Chatbox isShrunk={isShrunk} />
    </div>
  );
}

export default App;
