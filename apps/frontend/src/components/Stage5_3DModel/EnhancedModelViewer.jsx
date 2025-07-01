import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Text, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import backendService from '../../../services/backend.service';
import { Deck3DModelCreator } from '../../visualizers/deck-3d-model';

// Physical Deck Components (simplified from original)
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
      />
    </mesh>
  );
}

function PhysicalDeck({ dimensions, customization }) {
  const { length, width, height = 0.5 } = dimensions;
  const { material = {} } = customization;

  const defaultMaterial = {
    color: '#8B4513',
    roughness: 0.8,
    metalness: 0.1,
    animated: false
  };

  const deckMaterial = { ...defaultMaterial, ...material };

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial 
          color={deckMaterial.color}
          roughness={deckMaterial.roughness}
          metalness={deckMaterial.metalness}
        />
      </mesh>
    </group>
  );
}

// Card Deck 3D Component
function CardDeck3D({ deck, options }) {
  const groupRef = useRef();
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (deck && deck.cards) {
      // Create 3D card representations
      const cardMeshes = deck.cards.map((card, index) => {
        const position = calculateCardPosition(index, deck.cards.length, options.layoutMode);
        return {
          ...card,
          position,
          rotation: [0, 0, 0]
        };
      });
      setCards(cardMeshes);
    }
  }, [deck, options.layoutMode]);

  const calculateCardPosition = (index, total, layoutMode) => {
    switch (layoutMode) {
      case 'stack':
        return [0, index * 0.01, 0];
      case 'spread':
        return [(index - total / 2) * 0.1, 0, 0];
      case 'grid':
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        return [(col - cols / 2) * 0.15, 0, (row - Math.ceil(total / cols) / 2) * 0.2];
      case 'circle':
        const angle = (index / total) * Math.PI * 2;
        const radius = 2;
        return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
      default:
        return [0, index * 0.01, 0];
    }
  };

  useFrame((state) => {
    if (groupRef.current && options.animateCards) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {cards.map((card, index) => (
        <mesh key={index} position={card.position} rotation={card.rotation}>
          <boxGeometry args={[0.063, 0.001, 0.088]} />
          <meshStandardMaterial 
            color={card.isCommander && options.highlightCommander ? '#FFD700' : '#FFFFFF'}
            roughness={0.1}
            metalness={0.1}
          />
          {options.showCardDetails && (
            <Html position={[0, 0.05, 0]} center>
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '2px 4px',
                borderRadius: '2px',
                fontSize: '8px',
                whiteSpace: 'nowrap'
              }}>
                {card.name}
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </group>
  );
}

const EnhancedModelViewer = ({ analysisResult }) => {
  const [visualizationMode, setVisualizationMode] = useState('physical');
  const [cardDeck3D, setCardDeck3D] = useState(null);
  const cardDeck3DRef = useRef(null);
  
  const [physicalCustomization, setPhysicalCustomization] = useState({
    material: {
      color: '#8B4513',
      roughness: 0.8,
      metalness: 0.1,
      animated: false
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
    enablePan: true
  });

  // Create deck data from analysis results
  const deckData = analysisResult?.recognizedCards ? {
    cards: analysisResult.recognizedCards.map(card => ({
      name: card.name,
      quantity: card.quantity || 1,
      manaCost: card.manaCost || 1,
      type: card.type || 'Creature',
      colors: card.colors || ['C'],
      rarity: card.rarity || 'common',
      isCommander: card.isCommander || false
    })),
    totalCards: analysisResult.recognizedCards.reduce((sum, card) => sum + (card.quantity || 1), 0)
  } : null;

  const physicalDimensions = analysisResult
    ? { length: Math.sqrt(analysisResult.gross_living_area || 100), width: Math.sqrt(analysisResult.gross_living_area || 100) }
    : { length: 10, width: 20 };

  const updatePhysicalCustomization = (property, value) => {
    setPhysicalCustomization(prev => ({
      ...prev,
      material: {
        ...prev.material,
        [property]: value
      }
    }));
  };

  const updateCardDeckOptions = (property, value) => {
    setCardDeckOptions(prev => ({
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

  const exportModel = async () => {
    if (visualizationMode === 'cards' && cardDeck3D) {
      try {
        await cardDeck3D.export3DModel({ format: 'gltf' });
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
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
        maxWidth: '1400px',
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
        3D Deck Model Visualization
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
        Interactive 3D visualization with card positioning and export capabilities
      </motion.p>

      {/* Visualization Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', color: '#2d3748' }}>Visualization Mode:</span>
          <div style={{ display: 'flex', background: '#f7fafc', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setVisualizationMode('physical')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: visualizationMode === 'physical' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: visualizationMode === 'physical' ? 'white' : '#4a5568',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
            >
              Physical Deck
            </button>
            <button
              onClick={() => setVisualizationMode('cards')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: visualizationMode === 'cards' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: visualizationMode === 'cards' ? 'white' : '#4a5568',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
            >
              Card Deck
            </button>
          </div>
        </div>
      </motion.div>

      <div style={{ 
        display: 'flex', 
        width: '100%', 
        maxWidth: '1200px',
        gap: '2rem',
        height: '600px'
      }}>
        {/* Control Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{ 
            width: '300px', 
            padding: '1.5rem', 
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
            {visualizationMode === 'physical' ? 'Deck Customization' : 'Card Deck Options'}
          </h3>

          <AnimatePresence mode="wait">
            {visualizationMode === 'cards' ? (
              <motion.div
                key="card-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>
                    Layout Mode:
                  </label>
                  <select 
                    value={cardDeckOptions.layoutMode}
                    onChange={(e) => updateCardDeckOptions('layoutMode', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e0',
                      background: 'white'
                    }}
                  >
                    <option value="stack">Stack</option>
                    <option value="spread">Spread</option>
                    <option value="grid">Grid</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#2d3748' }}>
                    <input 
                      type="checkbox" 
                      checked={cardDeckOptions.animateCards}
                      onChange={(e) => updateCardDeckOptions('animateCards', e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Animate Cards
                  </label>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#2d3748' }}>
                    <input 
                      type="checkbox" 
                      checked={cardDeckOptions.highlightCommander}
                      onChange={(e) => updateCardDeckOptions('highlightCommander', e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Highlight Commander
                  </label>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#2d3748' }}>
                    <input 
                      type="checkbox" 
                      checked={cardDeckOptions.showCardDetails}
                      onChange={(e) => updateCardDeckOptions('showCardDetails', e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Show Card Details
                  </label>
                </div>

                <button 
                  onClick={exportModel}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginTop: '1rem'
                  }}
                >
                  Export 3D Model
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="physical-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>
                    Deck Color:
                  </label>
                  <input 
                    type="color" 
                    value={physicalCustomization.material.color}
                    onChange={(e) => updatePhysicalCustomization('color', e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '6px', border: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2d3748' }}>
                    Roughness: {physicalCustomization.material.roughness}
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={physicalCustomization.material.roughness}
                    onChange={(e) => updatePhysicalCustomization('roughness', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#2d3748' }}>
                    <input 
                      type="checkbox" 
                      checked={physicalCustomization.material.animated}
                      onChange={(e) => updatePhysicalCustomization('animated', e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Animated Preview
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera Controls */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <h4 style={{ marginBottom: '1rem', color: '#2d3748' }}>Camera Controls</h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#2d3748' }}>
                <input 
                  type="checkbox" 
                  checked={cameraControls.autoRotate}
                  onChange={(e) => updateCameraControls('autoRotate', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Auto Rotate
              </label>
            </div>
          </div>
        </motion.div>

        {/* 3D Viewer */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{ 
            flex: 1, 
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div 
            ref={cardDeck3DRef}
            style={{ width: '100%', height: '100%' }}
          >
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
              <Suspense fallback={null}>
                <Stage environment="city" intensity={0.6}>
                  {visualizationMode === 'physical' ? (
                    <PhysicalDeck 
                      dimensions={physicalDimensions} 
                      customization={physicalCustomization} 
                    />
                  ) : (
                    deckData && (
                      <CardDeck3D 
                        deck={deckData} 
                        options={cardDeckOptions} 
                      />
                    )
                  )}
                </Stage>
                <OrbitControls 
                  autoRotate={cameraControls.autoRotate}
                  enableZoom={cameraControls.enableZoom}
                  enablePan={cameraControls.enablePan}
                  autoRotateSpeed={2}
                />
              </Suspense>
            </Canvas>
          </div>

          {!deckData && visualizationMode === 'cards' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#718096',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '2rem',
              borderRadius: '12px'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>No Card Data Available</h3>
              <p>Upload and analyze a deck blueprint to view 3D card visualization</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EnhancedModelViewer;
