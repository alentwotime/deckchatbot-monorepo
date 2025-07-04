import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Text, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import backendService from '../../../services/backend.service';
import { Deck3DModelCreator } from '../../visualizers/deck-3d-model';

function DeckBoard({ position, dimensions, material, rotation = [0, 0, 0] }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && material.animated) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={[dimensions.length, dimensions.thickness, dimensions.width]} />
      <meshStandardMaterial 
        color={material.color}
        roughness={material.roughness}
        metalness={material.metalness}
        transparent={material.transparent}
        opacity={material.opacity}
      />
    </mesh>
  );
}

function DeckRailing({ position, dimensions, material }) {
  return (
    <group position={position}>
      {/* Vertical posts */}
      {Array.from({ length: Math.floor(dimensions.length / 2) }, (_, i) => (
        <mesh key={`post-${i}`} position={[i * 2 - dimensions.length / 2 + 1, 1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2]} />
          <meshStandardMaterial 
            color={material.railingColor}
            roughness={material.roughness}
            metalness={material.metalness}
          />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[dimensions.length, 0.1, 0.1]} />
        <meshStandardMaterial 
          color={material.railingColor}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>
    </group>
  );
}

function Deck({ dimensions, customization }) {
  const { length, width, height = 0.5 } = dimensions;
  const {
    material = {},
    showRailing = true,
    deckPattern = 'standard',
    boardSpacing = 0.1
  } = customization;

  const defaultMaterial = {
    color: '#8B4513',
    roughness: 0.8,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
    railingColor: '#654321',
    animated: false
  };

  const deckMaterial = { ...defaultMaterial, ...material };

  const renderDeckBoards = () => {
    const boards = [];
    const boardWidth = 0.15;
    const numBoards = Math.floor(width / (boardWidth + boardSpacing));

    for (let i = 0; i < numBoards; i++) {
      const zPos = (i - numBoards / 2) * (boardWidth + boardSpacing);
      boards.push(
        <DeckBoard
          key={`board-${i}`}
          position={[0, height / 2, zPos]}
          dimensions={{ length, width: boardWidth, thickness: height }}
          material={deckMaterial}
          rotation={deckPattern === 'diagonal' ? [0, Math.PI / 4, 0] : [0, 0, 0]}
        />
      );
    }
    return boards;
  };

  return (
    <group>
      {/* Main deck structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[length, height * 0.8, width]} />
        <meshStandardMaterial 
          color={deckMaterial.color}
          roughness={deckMaterial.roughness}
          metalness={deckMaterial.metalness}
        />
      </mesh>

      {/* Deck boards */}
      {renderDeckBoards()}

      {/* Railings */}
      {showRailing && (
        <>
          <DeckRailing 
            position={[0, 0, width / 2]} 
            dimensions={{ length, width }} 
            material={deckMaterial}
          />
          <DeckRailing 
            position={[0, 0, -width / 2]} 
            dimensions={{ length, width }} 
            material={deckMaterial}
          />
          <DeckRailing 
            position={[length / 2, 0, 0]} 
            dimensions={{ length: width, width }} 
            material={deckMaterial}
          />
          <DeckRailing 
            position={[-length / 2, 0, 0]} 
            dimensions={{ length: width, width }} 
            material={deckMaterial}
          />
        </>
      )}
    </group>
  );
}

const ModelViewer = ({ analysisResult }) => {
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('physical'); // 'physical' or 'cards'
  const [cardDeck3D, setCardDeck3D] = useState(null);
  const cardDeck3DRef = useRef(null);
  const [customization, setCustomization] = useState({
    material: {
      color: '#8B4513',
      roughness: 0.8,
      metalness: 0.1,
      railingColor: '#654321',
      animated: false
    },
    showRailing: true,
    deckPattern: 'standard',
    boardSpacing: 0.1,
    lighting: {
      intensity: 0.6,
      environment: 'city'
    }
  });

  const [cardDeckOptions, setCardDeckOptions] = useState({
    layoutMode: 'stack',
    cardSpacing: 0.1,
    showCardDetails: true,
    animateCards: true,
    highlightCommander: true
  });

  const [cameraControls, setCameraControls] = useState({
    autoRotate: false,
    enableZoom: true,
    enablePan: true,
    maxDistance: 50,
    minDistance: 5
  });

  // Initialize card deck 3D visualization
  useEffect(() => {
    if (visualizationMode === 'cards' && analysisResult?.recognizedCards) {
      // Create mock deck data from analysis results
      const mockDeck = {
        cards: analysisResult.recognizedCards.map(card => ({
          name: card.name,
          quantity: card.quantity || 1,
          manaCost: card.manaCost || 1,
          type: card.type || 'Creature',
          colors: card.colors || ['C'],
          rarity: card.rarity || 'common',
          isCommander: card.isCommander || false
        })),
        commander: analysisResult.recognizedCards.find(card => card.isCommander),
        totalCards: analysisResult.recognizedCards.reduce((sum, card) => sum + (card.quantity || 1), 0)
      };

      // Initialize Deck3DModelCreator if we have a container
      if (cardDeck3DRef.current && !cardDeck3D) {
        const deck3D = new Deck3DModelCreator(cardDeck3DRef.current);
        deck3D.setDeck(mockDeck);
        deck3D.setLayoutMode(cardDeckOptions.layoutMode);
        setCardDeck3D(deck3D);
      }
    }
  }, [visualizationMode, analysisResult, cardDeckOptions.layoutMode]);

  // Update card deck options
  const updateCardDeckOptions = (property, value) => {
    setCardDeckOptions(prev => ({
      ...prev,
      [property]: value
    }));

    if (cardDeck3D) {
      switch (property) {
        case 'layoutMode':
          cardDeck3D.setLayoutMode(value);
          break;
        case 'animateCards':
          cardDeck3D.setInteractionOptions({ enableAnimations: value });
          break;
        default:
          break;
      }
    }
  };

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

  const updateMaterial = (property, value) => {
    setCustomization(prev => ({
      ...prev,
      material: {
        ...prev.material,
        [property]: value
      }
    }));
  };

  const updateCustomization = (property, value) => {
    setCustomization(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const updateCameraControls = (property, value) => {
    setCameraControls(prev => ({
      ...prev,
      [property]: value
    }));
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
        width: '300px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        overflowY: 'auto',
        borderRight: '1px solid #ccc'
      }}>
        <h3>Deck Customization</h3>

        {/* Material Presets */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Material Presets:</label>
          <select 
            onChange={(e) => {
              if (e.target.value && materialPresets[e.target.value]) {
                const preset = materialPresets[e.target.value];
                setCustomization(prev => ({
                  ...prev,
                  material: {
                    ...prev.material,
                    ...preset
                  }
                }));
              }
            }}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">Custom</option>
            {Object.keys(materialPresets).map(preset => (
              <option key={preset} value={preset}>{preset.charAt(0).toUpperCase() + preset.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Material Properties */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Deck Color:</label>
          <input 
            type="color" 
            value={customization.material.color}
            onChange={(e) => updateMaterial('color', e.target.value)}
            style={{ width: '100%', height: '30px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Railing Color:</label>
          <input 
            type="color" 
            value={customization.material.railingColor}
            onChange={(e) => updateMaterial('railingColor', e.target.value)}
            style={{ width: '100%', height: '30px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Roughness: {customization.material.roughness}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            value={customization.material.roughness}
            onChange={(e) => updateMaterial('roughness', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Metalness: {customization.material.metalness}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            value={customization.material.metalness}
            onChange={(e) => updateMaterial('metalness', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Deck Options */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={customization.showRailing}
              onChange={(e) => updateCustomization('showRailing', e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Show Railings
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Deck Pattern:</label>
          <select 
            value={customization.deckPattern}
            onChange={(e) => updateCustomization('deckPattern', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="standard">Standard</option>
            <option value="diagonal">Diagonal</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Board Spacing: {customization.boardSpacing}</label>
          <input 
            type="range" 
            min="0.05" 
            max="0.3" 
            step="0.05"
            value={customization.boardSpacing}
            onChange={(e) => updateCustomization('boardSpacing', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Animation */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={customization.material.animated}
              onChange={(e) => updateMaterial('animated', e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Animated Preview
          </label>
        </div>

        {/* Camera Controls */}
        <h3>Camera Controls</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={cameraControls.autoRotate}
              onChange={(e) => updateCameraControls('autoRotate', e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Auto Rotate
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={cameraControls.enableZoom}
              onChange={(e) => updateCameraControls('enableZoom', e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Enable Zoom
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={cameraControls.enablePan}
              onChange={(e) => updateCameraControls('enablePan', e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Enable Pan
          </label>
        </div>

        <button onClick={handleEnhance} style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Enhance View
        </button>
      </div>

      {/* 3D Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        <h2 style={{ position: 'absolute', top: '10px', left: '20px', zIndex: 1, color: '#333' }}>
          Stage 5: 3D Model Generation
        </h2>
        <Canvas camera={{ position: [15, 10, 15], fov: 50 }}>
          <Suspense fallback={null}>
            <Stage environment={customization.lighting.environment} intensity={customization.lighting.intensity}>
              <Deck dimensions={dimensions} customization={customization} />
            </Stage>
            <OrbitControls 
              autoRotate={cameraControls.autoRotate}
              enableZoom={cameraControls.enableZoom}
              enablePan={cameraControls.enablePan}
              maxDistance={cameraControls.maxDistance}
              minDistance={cameraControls.minDistance}
              autoRotateSpeed={2}
            />
          </Suspense>
        </Canvas>

        {enhancedImage && (
          <div style={{ 
            position: 'absolute', 
            bottom: '20px', 
            right: '20px', 
            maxWidth: '200px',
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <img
              src={`data:image/png;base64,${enhancedImage}`}
              alt="Enhanced 3D view"
              style={{ width: '100%', borderRadius: '5px' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ModelViewer;
