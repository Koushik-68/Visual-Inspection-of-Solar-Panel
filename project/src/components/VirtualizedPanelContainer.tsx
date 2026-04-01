import React, { useEffect, useRef, useState } from 'react';
import { Panel } from '../types';
import Spinner from './common/Spinner';

interface VirtualizedPanelContainerProps {
  panels: Panel[];
  renderItem: (panel: Panel, index: number) => React.ReactNode;
  containerHeight?: number;
  itemHeight?: number;
  loadMoreThreshold?: number;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
}

/**
 * A virtualized container that only renders panels that are visible in the viewport
 * and gradually loads more as the user scrolls. This improves performance for large datasets.
 */
const VirtualizedPanelContainer: React.FC<VirtualizedPanelContainerProps> = ({
  panels,
  renderItem,
  containerHeight = 600,
  itemHeight = 120,
  loadMoreThreshold = 250,
  isLoading = false,
  emptyMessage = "No panels to display"
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Calculate the visible range based on scroll position
  const updateVisibleRange = () => {
    if (!containerRef.current) return;

    const { scrollTop, clientHeight } = containerRef.current;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
    const endIndex = Math.min(
      panels.length,
      Math.ceil((scrollTop + clientHeight) / itemHeight) + 5
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  };

  // Handle scroll events with debouncing to avoid too many updates
  const handleScroll = () => {
    if (!isScrolling) {
      setIsScrolling(true);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      updateVisibleRange();
    }, 100);

    // Use requestAnimationFrame to smooth out scroll performance
    requestAnimationFrame(updateVisibleRange);
  };

  // Initialize and cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      updateVisibleRange();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [panels.length]);

  // Calculate what to render
  const visiblePanels = panels.slice(visibleRange.start, visibleRange.end);
  const paddingTop = visibleRange.start * itemHeight;
  const totalHeight = panels.length * itemHeight;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ height: containerHeight }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="flex justify-center items-center text-gray-500" style={{ height: containerHeight }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight, position: 'relative' }}
    >
      <div 
        style={{ 
          height: totalHeight, 
          position: 'relative'
        }}
      >
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            transform: `translateY(${paddingTop}px)` 
          }}
        >
          {visiblePanels.map((panel, index) => (
            <div key={panel.id} style={{ height: itemHeight }}>
              {renderItem(panel, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
      {isScrolling && (
        <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-md z-50">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
};

export default VirtualizedPanelContainer; 