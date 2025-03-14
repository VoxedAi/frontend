import { useState, useEffect, useRef, ReactNode } from "react";

interface ResizablePanelProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  isRightPanelExpanded: boolean;
  defaultRightPanelWidth: number; // width in percentage
  minRightPanelWidth: number; // minimum width in percentage
  maxRightPanelWidth: number; // maximum width in percentage
}

export default function ResizablePanel({
  leftPanel,
  rightPanel,
  isRightPanelExpanded,
  defaultRightPanelWidth = 75,
  minRightPanelWidth = 20,
  maxRightPanelWidth = 80,
}: ResizablePanelProps) {
  // Track panel dimensions
  const [rightPanelWidth, setRightPanelWidth] = useState(defaultRightPanelWidth);
  const rightPanelWidthBeforeCollapse = useRef(defaultRightPanelWidth);
  
  // Track resize state
  const [isDragging, setIsDragging] = useState(false);
  
  // Track which panel is visible on mobile
  const [mobileActivePanel, setMobileActivePanel] = useState<'left' | 'right'>('left');
  
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resizeBarRef = useRef<HTMLDivElement>(null);
  
  // Force check on initial render
  useEffect(() => {
    checkIfMobile();
  }, []);

  // Function to check mobile state - defined outside useEffect to be reusable
  const checkIfMobile = () => {
    const newIsMobile = window.innerWidth < 1080;
    
    if (isMobile !== newIsMobile) {
      setIsMobile(newIsMobile);
      
      // When transitioning from mobile to desktop
      if (isMobile && !newIsMobile) {
        // Reset to desktop view settings
        if (isRightPanelExpanded) {
          setRightPanelWidth(rightPanelWidthBeforeCollapse.current);
        }
      }
    }
  };

  // Set up resize listener
  useEffect(() => {
    // Set up listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile, isRightPanelExpanded]);

  // Handle panel expansion/collapse
  useEffect(() => {
    if (isRightPanelExpanded) {
      // Restore previous width when expanding
      setRightPanelWidth(rightPanelWidthBeforeCollapse.current);
      // On mobile, switch to right panel when it's expanded
      if (isMobile) {
        setMobileActivePanel('right');
      }
    } else {
      // Save current width before collapsing
      if (rightPanelWidth > 0) {
        rightPanelWidthBeforeCollapse.current = rightPanelWidth;
      }
      setRightPanelWidth(0);
      // On mobile, switch to left panel when right panel is collapsed
      if (isMobile) {
        setMobileActivePanel('left');
      }
    }
  }, [isRightPanelExpanded, isMobile]);

  // Calculate current panel widths
  const effectiveRightPanelWidth = isRightPanelExpanded ? rightPanelWidth : 0;
  const leftPanelWidth = 100 - effectiveRightPanelWidth;

  // Start dragging handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Apply styles to prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    // Remove transitions during dragging for real-time responsiveness
    if (leftPanelRef.current) {
      leftPanelRef.current.style.transition = 'none';
    }
    if (rightPanelRef.current) {
      rightPanelRef.current.style.transition = 'none';
    }
    if (resizeBarRef.current) {
      resizeBarRef.current.style.transition = 'none';
    }
    
    setIsDragging(true);
  };

  // Effect to handle resize actions
  useEffect(() => {
    if (!isDragging) return;
    
    const handleResize = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Get container dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Calculate the position relative to the container
      const mouseX = e.clientX - containerRect.left;
      const positionPercentage = (mouseX / containerWidth) * 100;
      
      // Calculate the right panel width and clamp to min/max
      const newRightPanelWidth = Math.max(
        minRightPanelWidth,
        Math.min(maxRightPanelWidth, 100 - positionPercentage)
      );
      
      // Update state for React to track
      setRightPanelWidth(newRightPanelWidth);
      
      // For smoother real-time updates, directly set styles
      if (leftPanelRef.current) {
        leftPanelRef.current.style.width = `${100 - newRightPanelWidth}%`;
      }
      
      if (rightPanelRef.current) {
        rightPanelRef.current.style.width = `${newRightPanelWidth}%`;
      }
      
      if (resizeBarRef.current) {
        resizeBarRef.current.style.left = `${100 - newRightPanelWidth}%`;
      }
    };
    
    const handleMouseUp = () => {
      // Clear styles when done resizing
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // Restore transitions when done dragging
      if (leftPanelRef.current) {
        leftPanelRef.current.style.transition = '';
      }
      if (rightPanelRef.current) {
        rightPanelRef.current.style.transition = '';
      }
      if (resizeBarRef.current) {
        resizeBarRef.current.style.transition = '';
      }
      
      setIsDragging(false);
    };
    
    // Add global event listeners
    window.addEventListener('mousemove', handleResize, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Make sure styles are cleared
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // Restore transitions
      if (leftPanelRef.current) {
        leftPanelRef.current.style.transition = '';
      }
      if (rightPanelRef.current) {
        rightPanelRef.current.style.transition = '';
      }
      if (resizeBarRef.current) {
        resizeBarRef.current.style.transition = '';
      }
    };
  }, [isDragging, minRightPanelWidth, maxRightPanelWidth]);

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      {/* Left panel */}
      <div 
        ref={leftPanelRef}
        className={`overflow-auto h-full ${isDragging ? '' : 'transition-[width] duration-300 ease-out'} ${isMobile ? '' : 'block'} ${isMobile && mobileActivePanel === 'right' ? 'hidden' : 'block'}`}
        style={{ width: isMobile ? '100%' : `${leftPanelWidth}%` }}
      >
        {leftPanel}
      </div>
      
      {/* Resize handle - Explicitly sized with visible area - Only visible on desktop */}
      {isRightPanelExpanded && !isMobile && (
        <div 
          ref={resizeBarRef}
          className={`absolute h-full z-10 cursor-col-resize flex items-center justify-center select-none ${isDragging ? '' : 'transition-[left] duration-300 ease-out'} ${isMobile ? 'hidden' : 'flex'}`}
          style={{
            left: `${leftPanelWidth}%`,
            width: '12px',  // Wider hit area for easier interaction
            transform: 'translateX(-50%)',  // Center on the dividing line
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Visible divider line */}
          <div 
            className={`w-1 h-full ${
              isDragging 
                ? 'bg-primary' 
                : 'bg-card hover:bg-primary transition-colors duration-200'
            }`}
          />
        </div>
      )}
      
      {/* Right panel */}
      <div 
        ref={rightPanelRef}
        className={`overflow-auto h-full ${isDragging ? '' : 'transition-[width] duration-300 ease-out'} ${isMobile ? '' : 'block'} ${isMobile && mobileActivePanel === 'left' ? 'hidden' : 'block'}`}
        style={{ 
          width: isMobile 
            ? '100%' 
            : (isRightPanelExpanded ? `${effectiveRightPanelWidth}%` : 0) 
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
