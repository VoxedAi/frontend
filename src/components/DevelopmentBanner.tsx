import React from 'react';

const DevelopmentBanner: React.FC = () => {
  return (
    <div className="bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white py-2 text-center font-medium">
      🚧 This site is currently under development. Some features may not work as expected. 🚧
    </div>
  );
};

export default DevelopmentBanner; 