/**
 * Popup Renderer Contract
 * Defines the interface for rendering marker popups with WAGDIE theming
 */

import type { Location, CharacterLocation, EventMarker } from '@/lib/types/map';

export interface PopupContent {
  title: string;
  description?: string;
  details?: Record<string, string | number>;
  actions?: PopupAction[];
  accentColor?: string;
}

export interface PopupAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface PopupRendererProps {
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  data: Location | CharacterLocation | EventMarker;
  content: PopupContent;
  maxWidth?: number;
  className?: string;
}

export interface PopupRenderer {
  (props: PopupRendererProps): JSX.Element;
}

/**
 * Content builder functions for each marker type
 */
export interface PopupContentBuilder {
  buildLocationContent(location: Location): PopupContent;
  buildCharacterContent(character: CharacterLocation): PopupContent;
  buildEventContent(event: EventMarker): PopupContent;
}

/**
 * Styling configuration for popup components
 */
export interface PopupStyles {
  titleColor: string;
  descriptionColor: string;
  detailLabelColor: string;
  detailValueColor: string;
  backgroundColor: string;
  borderColor: string;
  fontFamily: string;
}
