import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
      }}
    >
      <div className="spinner spinner-primary"></div>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
};

export default Loading;
