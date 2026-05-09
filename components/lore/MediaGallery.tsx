import Image from 'next/image';
import type { LoreMedia } from '@/lib/lore/types';

interface MediaGalleryProps {
  media: LoreMedia[];
  title?: string;
}

const mediaSrc = (media: LoreMedia) => media.url ?? media.archivedUrl;

export function MediaGallery({ media, title = 'Media archive' }: MediaGalleryProps) {
  if (media.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-eskapade uppercase tracking-[0.28em] text-soul-accent">
          {title}
        </p>
        <h2 className="mt-2 font-display text-2xl lowercase tracking-widest text-bone">
          Preserved fragments
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {media.map((item) => {
          const src = mediaSrc(item);

          return (
            <figure key={item.id} className="overflow-hidden border border-midnight-light/50 bg-black/20">
              <div className="relative flex min-h-48 items-center justify-center bg-soul-950/80">
                {src && item.kind === 'image' ? (
                  <Image
                    src={src}
                    alt={item.alt ?? item.title}
                    width={720}
                    height={420}
                    className="max-h-72 w-full object-contain p-6"
                  />
                ) : src && item.kind === 'video' ? (
                  <video className="max-h-72 w-full" controls preload="metadata" aria-label={item.alt ?? item.title}>
                    <source src={src} />
                    Your browser does not support the archived video preview.
                  </video>
                ) : (
                  <div className="p-8 text-center text-sm font-eskapade text-neutral-600">
                    No previewable media URL is available for this record.
                  </div>
                )}
              </div>

              <figcaption className="space-y-2 border-t border-midnight-light/40 p-4">
                <p className="font-eskapade text-sm text-ash">{item.title}</p>
                <p className="text-xs font-eskapade leading-relaxed text-neutral-600">
                  {item.attribution}
                </p>
                {item.archivedUrl && (
                  <p className="break-all text-[0.7rem] font-eskapade text-neutral-700">
                    Archived: {item.archivedUrl}
                  </p>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
