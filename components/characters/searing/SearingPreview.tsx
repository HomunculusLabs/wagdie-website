import type { OwnedSearableConcord } from '@/hooks/useSearingConcords';
import { Badge } from '@/components/ui/Badge';

interface SearingPreviewProps {
  wagdieId: number;
  wagdieName: string;
  concord: OwnedSearableConcord | null;
}

export function SearingPreview({ wagdieId, wagdieName, concord }: SearingPreviewProps) {
  return (
    <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
      <p className="text-sm text-neutral-400 font-eskapade">Searing Preview</p>
      <p className="text-lg font-eskapade text-neutral-200">
        {wagdieName} #{wagdieId}
      </p>

      {concord ? (
        <div className="mt-4 flex gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-700 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={concord.imageUrl}
              alt={concord.name}
              className="h-full w-full object-cover [image-rendering:pixelated]"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <div>
              <p className="truncate text-base text-neutral-100 font-eskapade" title={concord.name}>
                {concord.name}
              </p>
              <p className="text-xs text-neutral-500 font-eskapade">Concord #{concord.concordId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {concord.location && <Badge variant="outline">{concord.location}</Badge>}
              {concord.newTrait && <Badge variant="accent">{concord.newTrait}</Badge>}
              {concord.makesBald && <Badge variant="default">balding</Badge>}
            </div>
            <p className="text-xs text-neutral-400 font-eskapade">
              This Concord will be burned and its searing trait will be materialized off-chain after the transaction confirms.
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500 font-eskapade">
          Select one of your searable Concords to preview the transformation.
        </p>
      )}
    </div>
  );
}
