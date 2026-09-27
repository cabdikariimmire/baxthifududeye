import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * A4ScaleWrapper — Responsive container that scales A4 document pages
 * to fit the available width while preserving exact A4 proportions.
 *
 * The logical A4 page is 210mm wide (≈793.7px at 96 DPI).
 * This wrapper measures its parent container and applies CSS transform: scale()
 * so the page shrinks gracefully on smaller screens without changing
 * the internal document dimensions.
 */
const A4_WIDTH_PX = 793.7; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1122.5; // 297mm at 96 DPI

const A4ScaleWrapper = ({ children, className = '', pageCount = 1 }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const recalcScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    // Add padding allowance (32px = 16px each side)
    const availableWidth = containerWidth - 32;
    const newScale = Math.min(1, availableWidth / A4_WIDTH_PX);
    setScale(newScale);
  }, []);

  useEffect(() => {
    recalcScale();

    const ro = new ResizeObserver(() => {
      recalcScale();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, [recalcScale]);

  // Calculate the scaled height so the container doesn't collapse
  const scaledHeight = A4_HEIGHT_PX * scale * pageCount + (pageCount > 1 ? (pageCount - 1) * 32 * scale : 0);

  return (
    <div
      ref={containerRef}
      className={`a4-workspace ${className}`}
    >
      <div
        className="a4-scale-container"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: `${A4_WIDTH_PX}px`,
          minHeight: `${A4_HEIGHT_PX}px`,
        }}
      >
        {children}
      </div>
      {/* Spacer to maintain correct layout flow */}
      {scale < 1 && (
        <div style={{ height: `${scaledHeight - A4_HEIGHT_PX * pageCount}px` }} aria-hidden="true" />
      )}
    </div>
  );
};

export default A4ScaleWrapper;
