import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ArtworkZoomViewerProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ArtworkZoomViewer: React.FC<ArtworkZoomViewerProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.3, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.3, 0.8);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Desktop wheel zoom with Ctrl or direct wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch handlers
  const touchStartDist = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      setScale((prev) => Math.max(0.8, Math.min(prev * factor, 4)));
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-[70%]">
          <h3 className="font-serif text-sm text-[#F1E2CB] truncate">{title}</h3>
          <p className="text-[10px] font-sans text-[#A99D8E]">
            {Math.round(scale * 100)}% • Arraste para mover quando ampliado
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Zoom View"
          className="w-10 h-10 rounded-full bg-[#272320]/80 border border-white/20 flex items-center justify-center text-[#F1E2CB] hover:bg-[#332E2A] active:scale-95 transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Image Stage */}
      <main
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 flex items-center justify-center relative overflow-hidden p-2 ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        onClick={() => {
          if (scale === 1) handleZoomIn();
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxWidth: '96vw',
            maxHeight: '80vh',
          }}
          className="object-contain pointer-events-none rounded-lg shadow-2xl"
          draggable={false}
        />
      </main>

      {/* Floating Bottom Controls */}
      <footer className="p-4 flex items-center justify-center gap-3 z-20 pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex items-center gap-2 bg-[#191715]/90 border border-[#433D37] px-4 py-2 rounded-full shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.8}
            aria-label="Zoom Out"
            className="p-1.5 rounded-full hover:bg-[#272320] text-[#F1E2CB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <span className="font-mono text-xs text-[#D9B98D] px-2 min-w-[50px] text-center font-medium">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            aria-label="Zoom In"
            className="p-1.5 rounded-full hover:bg-[#272320] text-[#F1E2CB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-4 bg-[#433D37] mx-1" />

          <button
            onClick={handleReset}
            aria-label="Reset Zoom"
            className="p-1.5 rounded-full hover:bg-[#272320] text-[#A99D8E] hover:text-[#F1E2CB] transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
