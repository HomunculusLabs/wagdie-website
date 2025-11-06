/**
 * LocationMarker Component
 *
 * Specialized marker component for displaying location markers on the map.
 * Thin wrapper around MarkerComponent with location-specific props.
 */

'use client';

import React from 'react';
import MarkerComponent from '../MarkerComponent';
import type { Location } from '@/lib/types/map';
import type { BaseMarkerProps } from '@/specs/008-map-refactor/contracts/marker-component';

export interface LocationMarkerProps extends BaseMarkerProps {
  type: 'location';
  data: Location;
}

/**
 * LocationMarker component
 */
export const LocationMarker: React.FC<LocationMarkerProps> = (props) => {
  const { type, data, ...rest } = props;

  return <MarkerComponent type={type} data={data} {...rest} />;
};

export default LocationMarker;
