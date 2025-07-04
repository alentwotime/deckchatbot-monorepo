import React from 'react';
import { motion } from 'framer-motion';

const Introduction = () => {
  return (
    <motion.div 
      style={{ height: '100vh', border: '1px solid #ccc', padding: '20px', margin: '10px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h2>Stage 1: Introduction and Chatbox</h2>
      <p>Full-screen chatbox goes here. As you scroll, it will shrink to the corner.</p>
      <button>Start Designing Your Deck</button>
    </motion.div>
  );
};

export default Introduction;
