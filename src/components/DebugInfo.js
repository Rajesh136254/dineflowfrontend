import React from 'react';

export default function DebugInfo() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '5px'
    }}>
      <div>API URL: {process.env.REACT_APP_API_URL || 'NOT FOUND'}</div>
      <div>Node Env: {process.env.NODE_ENV}</div>
    </div>
  );
}