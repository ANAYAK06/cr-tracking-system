import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AiOutlineLoading3Quarters className={`${sizes[size]} text-primary-600 animate-spin`} />
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;