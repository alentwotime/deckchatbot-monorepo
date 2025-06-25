import React from 'react';

const Chatbox = ({ isShrunk }) => {
  const style = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: isShrunk ? '300px' : '100%',
    height: isShrunk ? '400px' : '100%',
    border: '1px solid #ccc',
    backgroundColor: 'white',
    transition: 'all 0.3s ease-in-out',
    zIndex: 1000,
  };

  return (
    <div style={style}>
      <h3>Chatbot</h3>
      <p>Contextual tips will appear here.</p>
    </div>
  );
};

export default Chatbox;
