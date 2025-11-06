/**
 * Popup Renderer Component
 *
 * Reusable component for displaying marker popups with consistent WAGDIE theming.
 * Supports all marker types (location, character, burn, death, fight) and provides
 * a consistent visual experience across the map.
 */

'use client';

import React from 'react';
import type {
  PopupContent,
  PopupAction,
  PopupRendererProps,
  PopupStyles,
} from '@/specs/008-map-refactor/contracts/popup-renderer';

/**
 * Default WAGDIE styling configuration
 */
const defaultStyles: PopupStyles = {
  titleColor: '#d4af37', // Gold
  descriptionColor: '#e8e8e8', // Bone
  detailLabelColor: '#b0b0b0', // Mist
  detailValueColor: '#e8e8e8', // Bone
  backgroundColor: '#1a1a1a', // Abyss
  borderColor: '#252525', // Shadow
  fontFamily: "'Wagdie_Fraktur_21', serif",
};

/**
 * Get accent color based on marker type
 */
function getAccentColor(type: PopupRendererProps['type']): string {
  const colorMap: Record<PopupRendererProps['type'], string> = {
    location: '#d4af37', // Gold
    character: '#4a7c59', // Green
    burn: '#ff6b35', // Orange-red
    death: '#c92a2a', // Red
    fight: '#ff6b35', // Orange-red
  };

  return colorMap[type];
}

/**
 * Render action buttons
 */
function renderActions(actions: PopupAction[] = []): React.ReactNode {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            flex: 1,
            background: action.variant === 'primary' ? '#d4af37' : '#252525',
            color: action.variant === 'primary' ? '#0a0a0a' : '#e8e8e8',
            border: `1px solid ${action.variant === 'primary' ? '#d4af37' : '#252525'}`,
            padding: '8px 12px',
            borderRadius: '4px',
            fontFamily: defaultStyles.fontFamily,
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            opacity: action.disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            if (!action.disabled) {
              e.currentTarget.style.filter = 'brightness(110%)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.filter = 'brightness(100%)';
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Main PopupRenderer component
 */
const PopupRendererComponent: React.FC<PopupRendererProps> = ({
  type,
  data,
  content,
  maxWidth = 300,
  className = '',
}) => {
  const accentColor = content.accentColor || getAccentColor(type);
  const styles = { ...defaultStyles };

  return (
    <div
      className={className}
      style={{
        fontFamily: styles.fontFamily,
        minWidth: '250px',
        maxWidth: `${maxWidth}px`,
      }}
    >
      {/* Title */}
      <h3
        style={{
          color: accentColor,
          fontWeight: 'bold',
          margin: '0 0 8px 0',
          padding: '0 0 4px 0',
          borderBottom: `1px solid ${styles.borderColor}`,
          fontSize: '14px',
        }}
      >
        {content.title}
      </h3>

      {/* Description */}
      {content.description && (
        <p
          style={{
            color: styles.descriptionColor,
            fontSize: '12px',
            margin: '0 0 12px 0',
            lineHeight: '1.4',
          }}
        >
          {content.description}
        </p>
      )}

      {/* Details */}
      {content.details && Object.keys(content.details).length > 0 && (
        <div
          style={{
            background: styles.backgroundColor,
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        >
          {Object.entries(content.details).map(([key, value]) => (
            <div
              key={key}
              style={{
                fontSize: '11px',
                marginBottom: '4px',
                color: styles.detailLabelColor,
              }}
            >
              <span style={{ color: styles.detailValueColor }}>{key}:</span>{' '}
              <span>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {renderActions(content.actions)}
    </div>
  );
};

export const PopupRenderer = React.memo(PopupRendererComponent);

export default PopupRenderer;
