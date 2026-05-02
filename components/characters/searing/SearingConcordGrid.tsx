import type { OwnedSearableConcord } from '@/hooks/useSearingConcords';
import { Empty } from '@/components/ui/Empty';

interface SearingConcordGridProps {
  concords: OwnedSearableConcord[];
  selectedConcordId: number | null;
  isLoading?: boolean;
  disabled?: boolean;
  onSelect: (concord: OwnedSearableConcord) => void;
}

export function SearingConcordGrid({
  concords,
  selectedConcordId,
  isLoading = false,
  disabled = false,
  onSelect,
}: SearingConcordGridProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-700 bg-white/5 p-4 text-sm text-neutral-400 font-eskapade">
        Searching your Concords…
      </div>
    );
  }

  if (concords.length === 0) {
    return (
      <Empty
        message="No owned searable Concords found"
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-300 font-eskapade">Owned searable Concords</p>
        <p className="text-xs text-neutral-500 font-eskapade">{concords.length} available</p>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4" role="listbox" aria-label="Owned searable Concords">
        {concords.map((concord) => {
          const selected = concord.concordId === selectedConcordId;

          return (
            <button
              key={concord.concordId}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onSelect(concord)}
              className={`group relative overflow-hidden rounded-lg border bg-black/30 p-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-soul-accent shadow-soul-glow bg-soul-accent/10'
                  : 'border-neutral-700 hover:border-soul-accent/60'
              }`}
            >
              <div className="aspect-square overflow-hidden rounded-md bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={concord.imageUrl}
                  alt={concord.name}
                  className="h-full w-full object-cover [image-rendering:pixelated]"
                  loading="lazy"
                />
              </div>
              <div className="mt-2 min-w-0">
                <p className="truncate text-xs text-neutral-200 font-eskapade" title={concord.name}>
                  {concord.name}
                </p>
                <p className="text-[11px] text-neutral-500 font-eskapade">#{concord.concordId}</p>
              </div>
              <span className="absolute right-1 top-1 rounded-full border border-white/20 bg-black/80 px-1.5 py-0.5 text-[10px] text-neutral-200 font-eskapade">
                ×{concord.amount.toString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
