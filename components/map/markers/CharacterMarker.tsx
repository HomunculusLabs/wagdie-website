/**
 * CharacterMarker Component
 *
 * Specialized marker component for displaying character markers on the map.
 * Thin wrapper around MarkerComponent with character-specific props.
 */

'use client';

import React from 'react';
import MarkerComponent from '../MarkerComponent';
import type { CharacterLocation } from '@/lib/types/map';
import type { BaseMarkerProps } from '@/specs/008-map-refactor/contracts/marker-component';

export interface CharacterMarkerProps extends BaseMarkerProps {
  type: 'character';
  data: CharacterLocation;
}

/**
 * CharacterMarker component
 */
export const CharacterMarker: React.FC<CharacterMarkerProps> = (props) => {
  const { type, data, ...rest } = props;

  return <MarkerComponent type={type} data={data} {...rest} />;
};

export default CharacterMarker;
