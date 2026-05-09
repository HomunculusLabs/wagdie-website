import { LoreEventDetail } from './LoreEventDetail';
import type { ComponentProps } from 'react';

type CommunityEventDetailProps = Omit<ComponentProps<typeof LoreEventDetail>, 'communityContext'>;

export function CommunityEventDetail(props: CommunityEventDetailProps) {
  return <LoreEventDetail {...props} communityContext />;
}
