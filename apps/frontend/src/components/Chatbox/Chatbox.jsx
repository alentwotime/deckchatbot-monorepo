import React from 'react';
import { motion } from 'framer-motion';

const Chatbox = () => {
  return (
    <motion.div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '300px',
        height: '400px',
        border: '1px solid #ccc',
        backgroundColor: 'white',
        zIndex: 1000,
      }}
      initial={{ y: 500, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Chatbot</h3>
      <p>Contextual tips will appear here.</p>
    </motion.div>
  );
};

export default Chatbox;
