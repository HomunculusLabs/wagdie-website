/**
 * Tooltip Renderer Contract
 * Defines the interface for rendering marker tooltips
 */

import type { Location, CharacterLocation, EventMarker } from '@/lib/types/map';

export interface TooltipContent {
  title: string;
  subtitle?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TooltipRendererProps {
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  data: Location | CharacterLocation | EventMarker;
  content: TooltipContent;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  permanent?: boolean;
  opacity?: number;
}

export interface TooltipRenderer {
  (props: TooltipRendererProps): JSX.Element;
}

/**
 * Content builder functions for tooltips
 */
export interface TooltipContentBuilder {
  buildLocationTooltip(location: Location): TooltipContent;
  buildCharacterTooltip(character: CharacterLocation): TooltipContent;
  buildEventTooltip(event: EventMarker): TooltipContent;
}

/**
 * Tooltip styling configuration
 */
export interface TooltipStyles {
  backgroundColor: string;
  color: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  padding: string;
  borderRadius: string;
  boxShadow: string;
}
