import React from 'react';
import VoxPilot from './VoxPilot';

interface PilotViewProps {
  className?: string;
  title?: string;
  showHeader?: boolean;
  sidebarOpen?: boolean;
}

/**
 * PilotView - A container component for VoxPilot
 * Provides a header and styling wrapper around the VoxPilot component
 */
const PilotView: React.FC<PilotViewProps> = ({
  className = "",
  title = "VoxPilot",
  showHeader = true,
  sidebarOpen,
}) => {
  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {showHeader && (
        <header className="py-2 px-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium">{title}</h2>
        </header>
      )}
      
      <div className="flex-1 overflow-hidden">
        <VoxPilot sidebarOpen={sidebarOpen} />
      </div>
    </div>
  );
};

export default PilotView; 