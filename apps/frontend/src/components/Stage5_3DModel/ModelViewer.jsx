import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { motion } from 'framer-motion';
import backendService from '../../../services/backend.service';

function Deck({ dimensions }) {
  // Use dimensions from analysis to create the deck
  const { length, width } = dimensions;
  return (
    <mesh>
      <boxGeometry args={[length, 0.5, width]} />
      <meshStandardMaterial color={'#8B4513'} />
    </mesh>
  );
}

const ModelViewer = ({ analysisResult }) => {
  const [enhancedImage, setEnhancedImage] = useState(null);
  const dimensions = analysisResult
    ? { length: Math.sqrt(analysisResult.gross_living_area), width: Math.sqrt(analysisResult.gross_living_area) }
    : { length: 10, width: 20 };

  const handleEnhance = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    try {
      const result = await backendService.enhanceImage(base64);
      setEnhancedImage(result);
    } catch (err) {
      console.error('Enhance error', err);
    }
  };

  return (
    <motion.div 
      style={{ height: '100vh', border: '1px solid #ccc', padding: '20px', margin: '10px' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <h2>Stage 5: 3D Model Generation</h2>
      <Canvas>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Deck dimensions={dimensions} />
          </Stage>
          <OrbitControls autoRotate />
        </Suspense>
      </Canvas>
      <button onClick={handleEnhance}>Enhance View</button>
      {enhancedImage && (
        <img
          src={`data:image/png;base64,${enhancedImage}`}
          alt="Enhanced 3D view"
          style={{ marginTop: '10px', maxWidth: '100%' }}
        />
      )}
    </motion.div>
  );
};

export default ModelViewer;
