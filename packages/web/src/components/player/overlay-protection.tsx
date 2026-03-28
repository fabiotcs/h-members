'use client';

import { useCallback } from 'react';

interface OverlayProtectionProps {
  children?: React.ReactNode;
}

/**
 * Transparent overlay that prevents right-click context menu and drag
 * on the video player area. Visually invisible but blocks interactions
 * that could expose the underlying YouTube iframe URL.
 *
 * FR-026: Render transparent overlay over iframe to prevent right-click
 * and hinder capture of original video link.
 */
export function OverlayProtection({ children }: OverlayProtectionProps) {
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className="absolute inset-0 z-20"
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      style={{
        background: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // Allow pointer events through to Video.js controls at the bottom
        // but block on the main video area
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* Clickable blocker for the main video area (excludes control bar) */}
      <div
        className="absolute inset-x-0 top-0 bottom-12"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{
          pointerEvents: 'auto',
          cursor: 'default',
          background: 'transparent',
        }}
      />
      {children}
    </div>
  );
}
