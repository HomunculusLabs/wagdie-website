/**
 * BurnMarker Component
 *
 * Specialized marker component for displaying burn event markers on the map.
 * Thin wrapper around MarkerComponent with event-specific props.
 */

'use client';

import React from 'react';
import MarkerComponent from '../MarkerComponent';
import type { EventMarker } from '@/lib/types/map';
import type { BaseMarkerProps } from '@/specs/008-map-refactor/contracts/marker-component';

export interface BurnMarkerProps extends BaseMarkerProps {
  type: 'burn';
  data: EventMarker;
}

/**
 * BurnMarker component
 */
export const BurnMarker: React.FC<BurnMarkerProps> = (props) => {
  const { type, data, ...rest } = props;

  return <MarkerComponent type={type} data={data} {...rest} />;
};

export default BurnMarker;
