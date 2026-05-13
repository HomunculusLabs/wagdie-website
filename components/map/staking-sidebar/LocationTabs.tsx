'use client';

import { Badge } from '@/components/ui';
import type { LocationTab } from '@/hooks/map/useMapStakingPanel';

interface LocationTabsProps {
  activeTab: LocationTab;
  setActiveTab: (tab: LocationTab) => void;
  stakedCount: number;
  totalCharacters: number;
  isConnected: boolean;
}

export function LocationTabs({
  activeTab,
  setActiveTab,
  stakedCount,
  totalCharacters,
  isConnected,
}: LocationTabsProps) {
  const tabClassName = (tab: LocationTab) => `
    flex-1 px-3 py-2.5 rounded-md font-eskapade text-sm tracking-wide transition-all
    ${activeTab === tab
      ? 'bg-soul-accent/10 text-soul-accent border border-soul-accent/30'
      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
    }
  `;

  return (
    <div className="flex gap-1 p-1 bg-neutral-900/50 rounded-lg border border-neutral-800/50">
      <button
        type="button"
        onClick={() => setActiveTab('staked-here')}
        className={tabClassName('staked-here')}
      >
        At This Location
        <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">
          {stakedCount}
        </Badge>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('room')}
        className={tabClassName('room')}
      >
        Room
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('your-characters')}
        className={tabClassName('your-characters')}
      >
        Stake Here
        {isConnected && (
          <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">
            {totalCharacters}
          </Badge>
        )}
      </button>
    </div>
  );
}
