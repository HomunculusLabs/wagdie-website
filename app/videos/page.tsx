import type { Metadata } from 'next';
import Image from 'next/image';

import { BannerHeader } from '@/components/shared/BannerHeader';
import { AspectRatio } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Low Poly Videos | WAGDIE',
  description: 'Watch the WAGDIE low poly YouTube episode series.',
};

type LowPolyEpisode = {
  episode: number;
  label: string;
  youtubeUrl: string;
  embedUrl: string;
};

const LOW_POLY_ASSETS = {
  heroBanner: '/images/low-poly/low-poly-hero-banner.png',
  mapBanner: '/images/low-poly/low-poly-map-banner.png',
  logo: '/images/low-poly/low-poly-logo.webp',
};

const LOW_POLY_EPISODES: LowPolyEpisode[] = [
  {
    episode: 1,
    label: 'EP1',
    youtubeUrl: 'https://youtu.be/aWFCfmaZw8Q?si=2NvXo-JmRTg_YoC7',
    embedUrl: 'https://www.youtube-nocookie.com/embed/aWFCfmaZw8Q?rel=0',
  },
  {
    episode: 2,
    label: 'EP2',
    youtubeUrl: 'https://youtu.be/wmA1nplP03c?si=wWNeFYr0q2xf8XI-',
    embedUrl: 'https://www.youtube-nocookie.com/embed/wmA1nplP03c?rel=0',
  },
  {
    episode: 3,
    label: 'EP3',
    youtubeUrl: 'https://youtu.be/CxKhLK9Hsxs?si=3ec-sGFhvospUNEt',
    embedUrl: 'https://www.youtube-nocookie.com/embed/CxKhLK9Hsxs?rel=0',
  },
  {
    episode: 4,
    label: 'EP4',
    youtubeUrl: 'https://youtu.be/eGeLPMuUnFs?si=Bq4ddY-QBvgixdXJ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/eGeLPMuUnFs?rel=0',
  },
  {
    episode: 5,
    label: 'EP5',
    youtubeUrl: 'https://youtu.be/V6u74ijg9BM?si=kqfxGZJXoEOAGsIn',
    embedUrl: 'https://www.youtube-nocookie.com/embed/V6u74ijg9BM?rel=0',
  },
  {
    episode: 6,
    label: 'EP6',
    youtubeUrl: 'https://youtu.be/rNUmrU7lStA?si=MS30hUhrF8licltd',
    embedUrl: 'https://www.youtube-nocookie.com/embed/rNUmrU7lStA?rel=0',
  },
  {
    episode: 7,
    label: 'EP7',
    youtubeUrl: 'https://youtu.be/lB1em8oVTfg?si=e2uKF_ounjttbnAL',
    embedUrl: 'https://www.youtube-nocookie.com/embed/lB1em8oVTfg?rel=0',
  },
  {
    episode: 8,
    label: 'EP8',
    youtubeUrl: 'https://youtu.be/uPB-6Pg0rnU?si=XD9i1nxG00UEf7_0',
    embedUrl: 'https://www.youtube-nocookie.com/embed/uPB-6Pg0rnU?rel=0',
  },
  {
    episode: 9,
    label: 'EP9',
    youtubeUrl: 'https://youtu.be/0y8Numq4lBc?si=lAvN31iLoXKP5-yn',
    embedUrl: 'https://www.youtube-nocookie.com/embed/0y8Numq4lBc?rel=0',
  },
  {
    episode: 10,
    label: 'EP10',
    youtubeUrl: 'https://youtu.be/7PuMsN5WLHk?si=NFgsJkrVgR-Sj6lk',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7PuMsN5WLHk?rel=0',
  },
];

export default function LowPolyVideosPage() {
  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Low Poly Videos"
        subtitle="Watch the WAGDIE low poly episode series."
      />

      <section className="relative overflow-hidden border-b border-neutral-800 bg-black">
        <div className="relative h-[260px] md:h-[420px] lg:h-[520px]">
          <Image
            src={LOW_POLY_ASSETS.heroBanner}
            alt="WAGDIE low poly animated series hero artwork"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-soul-950 via-soul-950/25 to-black/20" />
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14 max-w-6xl">
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="rounded-lg border border-neutral-800 bg-black/40 p-6 md:p-8 shadow-2xl">
            <Image
              src={LOW_POLY_ASSETS.logo}
              alt="WAGDIE the animated series logo"
              width={628}
              height={680}
              className="mx-auto mb-6 h-auto w-52 md:w-64"
            />
            <p className="text-sm md:text-base text-neutral-500 font-eskapade leading-relaxed text-center lg:text-left">
              Enter the low poly chronicle: ten embedded transmissions from the WAGDIE world,
              gathered here for uninterrupted viewing.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black/40 shadow-2xl">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={LOW_POLY_ASSETS.mapBanner}
                alt="Low poly WAGDIE world map artwork"
                fill
                sizes="(min-width: 1024px) 450px, 100vw"
                className="object-cover"
              />
            </AspectRatio>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {LOW_POLY_EPISODES.map((episode) => (
            <article
              key={episode.label}
              className="group overflow-hidden rounded-lg border border-neutral-800 bg-black/40 shadow-2xl transition-colors duration-300 hover:border-soul-accent/40"
            >
              <div className="flex items-center justify-between gap-4 border-b border-neutral-800 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-soul-accent/80 font-eskapade">
                    {episode.label}
                  </p>
                  <h2 className="mt-1 text-xl font-display text-neutral-200 lowercase">
                    Low Poly Episode {episode.episode}
                  </h2>
                </div>
                <a
                  href={episode.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm font-eskapade text-neutral-500 transition-colors hover:text-soul-accent"
                >
                  YouTube
                </a>
              </div>

              <AspectRatio ratio={16 / 9} className="bg-black">
                <iframe
                  title={`WAGDIE Low Poly ${episode.label}`}
                  src={episode.embedUrl}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-full w-full border-0"
                />
              </AspectRatio>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
