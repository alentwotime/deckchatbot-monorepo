import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Chatbox component that docks to the corner as the user scrolls.
 * Initially full screen, then shrinks and moves to bottom-right.
 */
const Chatbox = () => {
  const [docked, setDocked] = useState(false);

  // Watch window scroll position to toggle docking state
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 300; // pixels scrolled before docking
      setDocked(window.scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const variants = {
    full: {
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      borderRadius: '0px',
    },
    docked: {
      top: 'auto',
      left: 'auto',
      bottom: 20,
      right: 20,
      width: 300,
      height: 400,
      borderRadius: '8px',
    },
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        zIndex: 1000,
      }}
      animate={docked ? 'docked' : 'full'}
      variants={variants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <h3>Chatbot</h3>
      <p>Contextual tips will appear here.</p>
    </motion.div>
  );
};

export default Chatbox;
