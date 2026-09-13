import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  getDefaultCoverElements,
  buildDefaultCoverLayout,
  mergeCoverDataWithLayout
} from '../../utils/coverLayout';
import { resolveLogoUrl, DEFAULT_LOGO_URL } from '../../utils/logoResolver';
import { ArrowUp, ArrowDown, RotateCcw, Move, Maximize2 } from 'lucide-react';

/**
 * Interactive A4 Cover Canvas Editor
 *
 * Implements a real, drag-and-drop editable A4 canvas (210mm x 297mm) with:
 * - Direct pointer-based dragging on all 14 academic cover elements
 * - Corner-handle resizing for the university logo with strict aspect-ratio lock
 * - Layer stacking controls (bring forward, send backward)
 * - Safe area bounding constraints (within A4 page)
 * - Real-time two-way synchronization with form data
 */
const CoverCanvasEditor = ({
  coverLayout,
  onLayoutChange,
  coverData = {},
  selectedElementId = null,
  onSelectElement,
  isInteractive = true
}) => {
  const canvasRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    isResizing: false,
    elementId: null,
    handle: null,
    startX: 0,
    startY: 0,
    initElemX: 0,
    initElemY: 0,
    initElemW: 0,
    initElemH: 0,
    aspectRatio: 1
  });

  // Ensure we have a valid layout
  const currentLayout = React.useMemo(() => {
    return mergeCoverDataWithLayout(coverLayout, coverData);
  }, [coverLayout, coverData]);

  const elements = currentLayout.elements || [];

  // Helper: get mm conversion ratio based on current rendered canvas width
  const getMmPerPx = useCallback(() => {
    if (!canvasRef.current) return 210 / 794; // fallback standard 96dpi
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width > 0 ? A4_WIDTH_MM / rect.width : 210 / 794;
  }, []);

  // Pointer Down on an Element (Start Drag)
  const handleElementPointerDown = (e, el) => {
    if (!isInteractive) return;
    e.stopPropagation();

    if (onSelectElement) {
      onSelectElement(el.id);
    }

    const mmPerPx = getMmPerPx();
    dragRef.current = {
      isDragging: true,
      isResizing: false,
      elementId: el.id,
      handle: null,
      startX: e.clientX,
      startY: e.clientY,
      initElemX: el.x || 0,
      initElemY: el.y || 0,
      initElemW: el.width || 100,
      initElemH: el.height || 20,
      aspectRatio: (el.width || 1) / (el.height || 1)
    };

    if (e.target && typeof e.target.setPointerCapture === 'function') {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Pointer Down on Resize Handle (Start Resize)
  const handleResizePointerDown = (e, el, handle) => {
    if (!isInteractive) return;
    e.stopPropagation();

    const mmPerPx = getMmPerPx();
    const ratio = (el.width || 35) / (el.height || 35);

    dragRef.current = {
      isDragging: false,
      isResizing: true,
      elementId: el.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initElemX: el.x || 0,
      initElemY: el.y || 0,
      initElemW: el.width || 35,
      initElemH: el.height || 35,
      aspectRatio: ratio > 0 ? ratio : 1
    };

    if (e.target && typeof e.target.setPointerCapture === 'function') {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Global Pointer Move
  const handlePointerMove = (e) => {
    if (!isInteractive) return;
    const { isDragging, isResizing, elementId, handle, startX, startY, initElemX, initElemY, initElemW, initElemH, aspectRatio } =
      dragRef.current;

    if (!isDragging && !isResizing) return;
    if (!elementId) return;

    const mmPerPx = getMmPerPx();
    const deltaX_mm = (e.clientX - startX) * mmPerPx;
    const deltaY_mm = (e.clientY - startY) * mmPerPx;

    if (isDragging) {
      // Clamped Movement within A4
      const targetEl = elements.find((item) => item.id === elementId);
      const elWidth = targetEl?.width || initElemW;
      const elHeight = targetEl?.height || initElemH;

      const minX = 0;
      const maxX = Math.max(0, A4_WIDTH_MM - elWidth);
      const minY = 0;
      const maxY = Math.max(0, A4_HEIGHT_MM - elHeight);

      const rawNewX = initElemX + deltaX_mm;
      const rawNewY = initElemY + deltaY_mm;

      const clampedX = Math.round(Math.min(Math.max(rawNewX, minX), maxX) * 10) / 10;
      const clampedY = Math.round(Math.min(Math.max(rawNewY, minY), maxY) * 10) / 10;

      const updated = elements.map((item) => {
        if (item.id === elementId) {
          return { ...item, x: clampedX, y: clampedY };
        }
        return item;
      });

      if (onLayoutChange) {
        onLayoutChange({
          ...currentLayout,
          elements: updated
        });
      }
    } else if (isResizing) {
      // Aspect-Ratio Preserving Resize
      let newW = initElemW;
      let newH = initElemH;
      let newX = initElemX;
      let newY = initElemY;

      // Handle corner direction
      if (handle === 'se') {
        const delta = Math.max(deltaX_mm, deltaY_mm * aspectRatio);
        newW = Math.max(15, Math.min(120, initElemW + delta));
        newH = newW / aspectRatio;
      } else if (handle === 'sw') {
        const delta = Math.max(-deltaX_mm, deltaY_mm * aspectRatio);
        newW = Math.max(15, Math.min(120, initElemW + delta));
        newH = newW / aspectRatio;
        newX = initElemX + (initElemW - newW);
      } else if (handle === 'ne') {
        const delta = Math.max(deltaX_mm, -deltaY_mm * aspectRatio);
        newW = Math.max(15, Math.min(120, initElemW + delta));
        newH = newW / aspectRatio;
        newY = initElemY + (initElemH - newH);
      } else if (handle === 'nw') {
        const delta = Math.max(-deltaX_mm, -deltaY_mm * aspectRatio);
        newW = Math.max(15, Math.min(120, initElemW + delta));
        newH = newW / aspectRatio;
        newX = initElemX + (initElemW - newW);
        newY = initElemY + (initElemH - newH);
      }

      // Clamp coordinates to A4 boundaries
      newX = Math.max(0, Math.min(A4_WIDTH_MM - newW, newX));
      newY = Math.max(0, Math.min(A4_HEIGHT_MM - newH, newY));

      const updated = elements.map((item) => {
        if (item.id === elementId) {
          return {
            ...item,
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
            width: Math.round(newW * 10) / 10,
            height: Math.round(newH * 10) / 10
          };
        }
        return item;
      });

      if (onLayoutChange) {
        onLayoutChange({
          ...currentLayout,
          elements: updated
        });
      }
    }
  };

  // Global Pointer Up
  const handlePointerUp = (e) => {
    if (!dragRef.current.isDragging && !dragRef.current.isResizing) return;
    dragRef.current.isDragging = false;
    dragRef.current.isResizing = false;
    dragRef.current.elementId = null;
    dragRef.current.handle = null;
  };

  // Deselect on Canvas Background Click
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('cover-canvas-bg')) {
      if (onSelectElement) onSelectElement(null);
    }
  };

  // Layer Controls
  const handleBringForward = (e, elId) => {
    e.stopPropagation();
    const updated = elements.map((item) => {
      if (item.id === elId) {
        return { ...item, zIndex: (item.zIndex || 1) + 1 };
      }
      return item;
    });
    if (onLayoutChange) {
      onLayoutChange({ ...currentLayout, elements: updated });
    }
  };

  const handleSendBackward = (e, elId) => {
    e.stopPropagation();
    const updated = elements.map((item) => {
      if (item.id === elId) {
        return { ...item, zIndex: Math.max(1, (item.zIndex || 1) - 1) };
      }
      return item;
    });
    if (onLayoutChange) {
      onLayoutChange({ ...currentLayout, elements: updated });
    }
  };

  // Reset Single Element Position
  const handleResetElement = (e, elId) => {
    e.stopPropagation();
    const defaultList = getDefaultCoverElements(coverData);
    const defaultItem = defaultList.find((d) => d.id === elId);
    if (!defaultItem) return;

    const updated = elements.map((item) => {
      if (item.id === elId) {
        return {
          ...item,
          x: defaultItem.x,
          y: defaultItem.y,
          width: defaultItem.width,
          height: defaultItem.height,
          zIndex: defaultItem.zIndex
        };
      }
      return item;
    });

    if (onLayoutChange) {
      onLayoutChange({ ...currentLayout, elements: updated });
    }
  };

  return (
    <div
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleCanvasClick}
      className={`cover-canvas-container cover-canvas-bg relative w-full h-full select-none ${
        isInteractive ? 'cursor-default' : ''
      }`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {elements.map((el) => {
        const isSelected = isInteractive && selectedElementId === el.id;
        const prefix = el.prefix || '';
        const rawContent = el.content || '';
        const displayText = prefix ? `${prefix}${rawContent}` : rawContent;

        return (
          <div
            key={el.id}
            id={`cover-el-${el.id}`}
            onPointerDown={(e) => handleElementPointerDown(e, el)}
            className={`cover-canvas-element absolute transition-shadow duration-75 ${
              isInteractive ? 'cursor-move' : ''
            } ${isSelected ? 'ring-2 ring-sky-500 ring-offset-1 bg-sky-50/20 rounded shadow-md z-30' : ''}`}
            style={{
              position: 'absolute',
              left: `${el.x}mm`,
              top: `${el.y}mm`,
              width: `${el.width}mm`,
              height: el.height ? `${el.height}mm` : 'auto',
              zIndex: isSelected ? 40 : el.zIndex || 1,
              touchAction: isInteractive ? 'none' : 'auto'
            }}
          >
            {/* Render Image Element (Logo) */}
            {el.type === 'image' ? (
              <div className="w-full h-full flex items-center justify-center p-0.5 pointer-events-none">
                <img
                  src={resolveLogoUrl(el.source || coverData.logoUrl)}
                  alt={el.label || 'شعار الجامعة'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = DEFAULT_LOGO_URL;
                  }}
                  draggable={false}
                />
              </div>
            ) : el.type === 'pill' ? (
              /* Render Pill Element (Research Title) */
              <div
                className="w-full h-full flex items-center justify-center rounded-xl shadow-sm px-4 py-1.5 pointer-events-none"
                style={{
                  backgroundColor: el.badgeColor || coverData.badgeColor || '#f0ad7c'
                }}
              >
                <span
                  className="font-amiri font-bold text-center leading-normal text-slate-950"
                  style={{
                    fontSize: el.fontSize ? `${el.fontSize}pt` : '20.5pt',
                    direction: 'rtl'
                  }}
                >
                  {displayText || 'بحث أكاديمي جديد'}
                </span>
              </div>
            ) : (
              /* Render Standard Text Element */
              <div
                className="w-full h-full flex items-center justify-center pointer-events-none"
                style={{
                  justifyContent:
                    el.textAlign === 'right'
                      ? 'flex-start'
                      : el.textAlign === 'left'
                      ? 'flex-end'
                      : 'center'
                }}
              >
                <span
                  className="font-amiri font-bold text-center leading-tight whitespace-normal text-slate-900"
                  style={{
                    fontSize: el.fontSize ? `${el.fontSize}pt` : '20pt',
                    color: el.color || '#0f172a',
                    direction: 'rtl'
                  }}
                >
                  {displayText}
                </span>
              </div>
            )}

            {/* Selection Controls Toolbar (Visible on Active Element) */}
            {isSelected && isInteractive && (
              <>
                {/* Floating Micro-Toolbar */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute -top-7 right-0 flex items-center gap-1 bg-slate-900 text-white rounded-md px-1.5 py-0.5 shadow-lg text-[10px] font-sans z-50 pointer-events-auto"
                >
                  <span className="font-bold text-teal-400 font-cairo px-1">{el.label || el.id}</span>
                  <button
                    type="button"
                    title="تقديم للأمام"
                    onClick={(e) => handleBringForward(e, el.id)}
                    className="p-1 hover:bg-slate-700 rounded transition"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    title="إرجاع للخلف"
                    onClick={(e) => handleSendBackward(e, el.id)}
                    className="p-1 hover:bg-slate-700 rounded transition"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    title="استعادة الموضع الافتراضي"
                    onClick={(e) => handleResetElement(e, el.id)}
                    className="p-1 hover:bg-slate-700 rounded text-amber-400 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Corner Resize Handles for Logo (or Resizable Elements) */}
                {el.type === 'image' && (
                  <>
                    <div
                      onPointerDown={(e) => handleResizePointerDown(e, el, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-sky-600 rounded-full cursor-nwse-resize shadow z-50"
                    />
                    <div
                      onPointerDown={(e) => handleResizePointerDown(e, el, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-sky-600 rounded-full cursor-nesw-resize shadow z-50"
                    />
                    <div
                      onPointerDown={(e) => handleResizePointerDown(e, el, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-sky-600 rounded-full cursor-nesw-resize shadow z-50"
                    />
                    <div
                      onPointerDown={(e) => handleResizePointerDown(e, el, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-sky-600 rounded-full cursor-nwse-resize shadow z-50"
                    />
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CoverCanvasEditor;
