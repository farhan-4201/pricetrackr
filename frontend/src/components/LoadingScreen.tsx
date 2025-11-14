import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="w-64 h-64">
        <DotLottieReact
          src="/Sandy Loading.json"
          loop
          autoplay
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
