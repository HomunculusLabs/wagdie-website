/**
 * DeathMarker Component
 *
 * Specialized marker component for displaying death event markers on the map.
 * Thin wrapper around MarkerComponent with event-specific props.
 */

'use client';

import React from 'react';
import MarkerComponent from '../MarkerComponent';
import type { EventMarker } from '@/lib/types/map';
import type { BaseMarkerProps } from '@/specs/008-map-refactor/contracts/marker-component';

export interface DeathMarkerProps extends BaseMarkerProps {
  type: 'death';
  data: EventMarker;
}

/**
 * DeathMarker component
 */
export const DeathMarker: React.FC<DeathMarkerProps> = (props) => {
  const { type, data, ...rest } = props;

  return <MarkerComponent type={type} data={data} {...rest} />;
};

export default DeathMarker;
