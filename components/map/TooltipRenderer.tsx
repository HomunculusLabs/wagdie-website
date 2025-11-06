/**
 * Tooltip Renderer Component
 *
 * Reusable component for displaying marker tooltips with consistent WAGDIE theming.
 * Lightweight component shown on hover for quick information display.
 */

'use client';

import React from 'react';
import type {
  TooltipContent,
  TooltipRendererProps,
  TooltipStyles,
} from '@/specs/008-map-refactor/contracts/tooltip-renderer';

/**
 * Default WAGDIE styling configuration for tooltips
 */
const defaultStyles: TooltipStyles = {
  backgroundColor: '#1a1a1a', // Abyss
  color: '#e8e8e8', // Bone
  fontFamily: "'Wagdie_Fraktur_21', serif",
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '6px 10px',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
};

/**
 * Get accent color based on marker type
 */
function getAccentColor(type: TooltipRendererProps['type']): string {
  const colorMap: Record<TooltipRendererProps['type'], string> = {
    location: '#d4af37', // Gold
    character: '#4a7c59', // Green
    burn: '#ff6b35', // Orange-red
    death: '#c92a2a', // Red
    fight: '#ff6b35', // Orange-red
  };

  return colorMap[type];
}

/**
 * Main TooltipRenderer component
 */
const TooltipRendererComponent: React.FC<TooltipRendererProps> = ({
  type,
  content,
  direction = 'top',
  className = '',
  permanent = false,
  opacity = 0.9,
}) => {
  const accentColor = getAccentColor(type);
  const styles = { ...defaultStyles };

  return (
    <div
      className={className}
      style={{
        fontFamily: styles.fontFamily,
        position: 'relative',
      }}
    >
      <div
        style={{
          background: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          boxShadow: styles.boxShadow,
          opacity: opacity,
          border: `1px solid ${accentColor}30`,
          maxWidth: '200px',
          wordWrap: 'break-word',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: content.subtitle ? '4px' : '0' }}>
          {content.title}
        </div>

        {/* Subtitle */}
        {content.subtitle && (
          <div
            style={{
              fontSize: '10px',
              color: '#b0b0b0',
              fontWeight: 'normal',
            }}
          >
            {content.subtitle}
          </div>
        )}
      </div>

      {/* Tooltip arrow */}
      {!permanent && (
        <div
          style={{
            position: 'absolute',
            width: '0',
            height: '0',
            borderStyle: 'solid',
          }}
        />
      )}
    </div>
  );
};

export const TooltipRenderer = React.memo(TooltipRendererComponent);

export default TooltipRenderer;
