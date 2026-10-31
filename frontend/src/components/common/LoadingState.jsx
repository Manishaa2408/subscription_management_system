import React from 'react';

export const LoadingState = ({ message = 'Loading data...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-500">{message}</span>
    </div>
  );
};

export default LoadingState;
