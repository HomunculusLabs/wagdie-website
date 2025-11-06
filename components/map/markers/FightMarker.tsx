/**
 * FightMarker Component
 *
 * Specialized marker component for displaying fight/battle event markers on the map.
 * Thin wrapper around MarkerComponent with event-specific props.
 */

'use client';

import React from 'react';
import MarkerComponent from '../MarkerComponent';
import type { EventMarker } from '@/lib/types/map';
import type { BaseMarkerProps } from '@/specs/008-map-refactor/contracts/marker-component';

export interface FightMarkerProps extends BaseMarkerProps {
  type: 'fight';
  data: EventMarker;
}

/**
 * FightMarker component
 */
export const FightMarker: React.FC<FightMarkerProps> = (props) => {
  const { type, data, ...rest } = props;

  return <MarkerComponent type={type} data={data} {...rest} />;
};

export default FightMarker;
