import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function AdvancedDeck({ dimensions, material }) {
  const groupRef = useRef();
  const { length = 10, width = 20, height = 0.5 } = dimensions;

  useFrame((state) => {
    if (groupRef.current && material.animated) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  // Create wood texture effect with multiple boards
  const createDeckBoards = () => {
    const boards = [];
    const boardWidth = 0.15;
    const boardSpacing = 0.02;
    const numBoards = Math.floor(width / (boardWidth + boardSpacing));

    for (let i = 0; i < numBoards; i++) {
      const zPos = (i - numBoards / 2) * (boardWidth + boardSpacing);
      boards.push(
        <mesh key={`board-${i}`} position={[0, height / 2, zPos]}>
          <boxGeometry args={[length, height, boardWidth]} />
          <meshStandardMaterial 
            color={material.color}
            roughness={material.roughness}
            metalness={material.metalness}
          />
        </mesh>
      );
    }
    return boards;
  };

  // Create support beams
  const createSupportBeams = () => {
    const beams = [];
    const beamSpacing = 2;
    const numBeams = Math.floor(length / beamSpacing);

    for (let i = 0; i < numBeams; i++) {
      const xPos = (i - numBeams / 2) * beamSpacing;
      beams.push(
        <mesh key={`beam-${i}`} position={[xPos, -height, 0]}>
          <boxGeometry args={[0.2, height * 2, width]} />
          <meshStandardMaterial 
            color={new THREE.Color(material.color).multiplyScalar(0.7)}
            roughness={material.roughness + 0.1}
            metalness={material.metalness}
          />
        </mesh>
      );
    }
    return beams;
  };

  // Create decorative railings with posts
  const createRailings = () => {
    if (!material.showRailing) return null;

    const railings = [];
    const postSpacing = 1.5;

    // Front and back railings
    [-width/2, width/2].forEach((zPos, index) => {
      const numPosts = Math.floor(length / postSpacing) + 1;

      // Posts
      for (let i = 0; i < numPosts; i++) {
        const xPos = (i - (numPosts - 1) / 2) * postSpacing;
        railings.push(
          <mesh key={`post-${index}-${i}`} position={[xPos, height + 1, zPos]}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial 
              color={material.railingColor}
              roughness={material.roughness}
              metalness={material.metalness}
            />
          </mesh>
        );
      }

      // Top rail
      railings.push(
        <mesh key={`rail-${index}`} position={[0, height + 2, zPos]}>
          <boxGeometry args={[length, 0.1, 0.1]} />
          <meshStandardMaterial 
            color={material.railingColor}
            roughness={material.roughness}
            metalness={material.metalness}
          />
        </mesh>
      );
    });

    return railings;
  };

  return (
    <group ref={groupRef}>
      {/* Main deck structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[length, height * 0.8, width]} />
        <meshStandardMaterial 
          color={new THREE.Color(material.color).multiplyScalar(0.8)}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>

      {/* Deck boards */}
      {createDeckBoards()}

      {/* Support beams */}
      {createSupportBeams()}

      {/* Railings */}
      {createRailings()}
    </group>
  );
}

const Model3D = ({ analysisResult }) => {
  const [material, setMaterial] = useState({
    color: '#8B4513',
    roughness: 0.8,
    metalness: 0.1,
    railingColor: '#654321',
    showRailing: true,
    animated: false
  });

  const [environment, setEnvironment] = useState('sunset');
  const [cameraPosition, setCameraPosition] = useState([15, 10, 15]);

  const dimensions = analysisResult
    ? { 
        length: Math.sqrt(analysisResult.gross_living_area), 
        width: Math.sqrt(analysisResult.gross_living_area),
        height: 0.5 
      }
    : { length: 10, width: 20, height: 0.5 };

  const downloadModel = (format) => {
    // This would integrate with a 3D export library
    console.log(`Downloading model in ${format} format...`);
    alert(`${format} download functionality would be implemented here with a 3D export library.`);
  };

  const captureScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'deck-preview.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const materialPresets = {
    cedar: { color: '#8B4513', roughness: 0.8, metalness: 0.1, railingColor: '#654321' },
    oak: { color: '#DEB887', roughness: 0.7, metalness: 0.1, railingColor: '#CD853F' },
    mahogany: { color: '#C04000', roughness: 0.6, metalness: 0.2, railingColor: '#8B0000' },
    composite: { color: '#696969', roughness: 0.4, metalness: 0.3, railingColor: '#2F4F4F' },
    painted: { color: '#F5F5DC', roughness: 0.3, metalness: 0.0, railingColor: '#FFFFFF' }
  };

  return (
    <motion.div 
      style={{ height: '100vh', display: 'flex', border: '1px solid #ccc', margin: '10px' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      {/* Control Panel */}
      <div style={{ 
        width: '280px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        overflowY: 'auto',
        borderRight: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#495057' }}>3D Deck Preview</h3>

        {/* Material Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Material:
          </label>
          <select 
            onChange={(e) => {
              if (materialPresets[e.target.value]) {
                setMaterial(prev => ({ ...prev, ...materialPresets[e.target.value] }));
              }
            }}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da' 
            }}
          >
            <option value="">Select Material</option>
            {Object.keys(materialPresets).map(preset => (
              <option key={preset} value={preset}>
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Environment */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Environment:
          </label>
          <select 
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da' 
            }}
          >
            <option value="sunset">Sunset</option>
            <option value="dawn">Dawn</option>
            <option value="night">Night</option>
            <option value="studio">Studio</option>
            <option value="city">City</option>
            <option value="forest">Forest</option>
          </select>
        </div>

        {/* Railing Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#495057' }}>
            <input 
              type="checkbox" 
              checked={material.showRailing}
              onChange={(e) => setMaterial(prev => ({ ...prev, showRailing: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            Show Railings
          </label>
        </div>

        {/* Animation Toggle */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#495057' }}>
            <input 
              type="checkbox" 
              checked={material.animated}
              onChange={(e) => setMaterial(prev => ({ ...prev, animated: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            Animated Preview
          </label>
        </div>

        {/* Download Buttons */}
        <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
          <h4 style={{ marginBottom: '15px', color: '#495057' }}>Export Options</h4>

          <button 
            onClick={() => downloadModel('OBJ')}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginBottom: '10px',
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download OBJ
          </button>

          <button 
            onClick={() => downloadModel('GLB')}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginBottom: '10px',
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download GLB
          </button>

          <button 
            onClick={captureScreenshot}
            style={{ 
              width: '100%', 
              padding: '10px',
              backgroundColor: '#ffc107', 
              color: '#212529', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Capture PNG
          </button>
        </div>

        {/* Camera Presets */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
          <h4 style={{ marginBottom: '15px', color: '#495057' }}>Camera Views</h4>

          <button 
            onClick={() => setCameraPosition([15, 10, 15])}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginBottom: '8px',
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Perspective View
          </button>

          <button 
            onClick={() => setCameraPosition([0, 20, 0])}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginBottom: '8px',
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Top View
          </button>

          <button 
            onClick={() => setCameraPosition([25, 5, 0])}
            style={{ 
              width: '100%', 
              padding: '8px',
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Side View
          </button>
        </div>
      </div>

      {/* 3D Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas 
          camera={{ position: cameraPosition, fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #87CEEB, #98FB98)' }}
        >
          <Suspense fallback={null}>
            <Environment preset={environment} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <AdvancedDeck dimensions={dimensions} material={material} />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxDistance={50}
              minDistance={5}
            />
          </Suspense>
        </Canvas>

        {/* Info Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '300px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Deck Specifications</h3>
          <p style={{ margin: '5px 0', color: '#6c757d' }}>
            <strong>Length:</strong> {dimensions.length.toFixed(1)} ft
          </p>
          <p style={{ margin: '5px 0', color: '#6c757d' }}>
            <strong>Width:</strong> {dimensions.width.toFixed(1)} ft
          </p>
          <p style={{ margin: '5px 0', color: '#6c757d' }}>
            <strong>Area:</strong> {(dimensions.length * dimensions.width).toFixed(1)} sq ft
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Model3D;
