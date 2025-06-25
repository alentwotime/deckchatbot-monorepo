import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { motion } from 'framer-motion';

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
  const dimensions = analysisResult 
    ? { length: Math.sqrt(analysisResult.gross_living_area), width: Math.sqrt(analysisResult.gross_living_area) } 
    : { length: 10, width: 20 };

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
    </motion.div>
  );
};

export default ModelViewer;
