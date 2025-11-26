import React from 'react';

const DebugInfo = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      API URL: {apiUrl}
    </div>
  );
};

export default DebugInfo;