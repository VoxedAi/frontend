import React from "react";

interface SidebarOverlayProps {
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  isMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  if (!isMobile || isCollapsed) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 right-0 bottom-0 left-64 bg-black/30 z-20 transition-all duration-300 ease-in-out"
      onClick={onToggleCollapse}
      aria-hidden="true"
    />
  );
};

export default SidebarOverlay;
