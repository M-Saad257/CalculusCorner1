import React from 'react';

const Loader = ({ text = "Loading...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="h-14 flex items-center justify-center relative mb-8">
        <div className="jimu-primary-loading"></div>
      </div>
      {text && (
        <div className="text-primary font-bold text-lg mt-4 animate-pulse text-center">
          {text}
        </div>
      )}
    </div>
  );
};

export default Loader;
