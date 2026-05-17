'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import {
  Layout,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Separator,
  AspectRatio,
  Blockquote,
  Badge,
  Modal,
} from '@/components/ui';

const showLoreNav = process.env.NEXT_PUBLIC_SHOW_LORE_NAV === 'true';

const VIDEO_CONSENT_COOKIE = 'wagdie_video_consent';
const VIDEO_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/wagdie';
const WIKI_URL = 'https://wiki.fateofwagdie.com';

type VideoConsent = 'granted' | 'denied' | null;

const readVideoConsent = (): VideoConsent => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${VIDEO_CONSENT_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === 'granted' || value === 'denied' ? value : null;
};

const setVideoConsentCookie = (value: Exclude<VideoConsent, null>) => {
  document.cookie = `${VIDEO_CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${VIDEO_CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
};

interface VideoPlayerProps {
  videoSrc: string;
  posterSrc: string;
  className?: string;
  hasConsent: boolean;
  onEnableVideo: () => void;
}

function VideoPlayer({ videoSrc, posterSrc, className, hasConsent, onEnableVideo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!hasConsent) {
      setIsMuted(true);
    }
  }, [hasConsent]);

  const handleUnmute = () => {
    if (!hasConsent) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => undefined);
    }
    setIsMuted(false);
  };

  return (
    <div className={`relative bg-black border border-neutral-800 shadow-2xl overflow-hidden ${className}`}>
      {hasConsent ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
          {isMuted && (
            <button
              type="button"
              onClick={handleUnmute}
              className="absolute inset-0 flex items-center justify-center bg-black/45 text-neutral-100 text-sm md:text-base tracking-wide uppercase transition-colors hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent"
              aria-label="Unmute WAGDIE introduction video"
            >
              <span className="flex items-center gap-2 px-4 py-2 border border-neutral-600 bg-black/50 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span className="font-eskapade">Click to Unmute</span>
              </span>
            </button>
          )}
        </>
      ) : (
        <div className="relative w-full h-full">
          <Image
            src={posterSrc}
            alt="Static preview frame for the WAGDIE introduction video"
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover grayscale-[35%] contrast-125"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-md text-sm md:text-base text-neutral-300 font-eskapade leading-relaxed">
              The introduction video is paused until you explicitly enable autoplay.
            </p>
            <Button type="button" onClick={onEnableVideo} className="h-12 px-8 text-base">
              Enable video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  imageSrc: string;
  href: string;
  cta: string;
  isExternal?: boolean;
}

function FeatureCard({ title, description, imageSrc, href, cta, isExternal }: FeatureCardProps) {
  const card = (
    <Card className="h-full overflow-hidden transition-all duration-500 hover:border-soul-accent/40 hover:shadow-[0_0_30px_rgba(200,170,110,0.1)] bg-black/40 flex flex-col">
      <div className="relative h-48 overflow-hidden border-b border-neutral-900">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover grayscale-[50%] contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-black/40 opacity-80" />
        {isExternal && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline">External</Badge>
          </div>
        )}
      </div>
      <CardHeader className="relative z-10 -mt-8 pt-0">
        <CardTitle className="text-h4 group-hover:text-soul-accent transition-colors duration-300 drop-shadow-md">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-5">
        <CardDescription className="text-neutral-500 leading-relaxed text-body flex-1">
          {description}
        </CardDescription>
        <span className="text-sm uppercase tracking-[0.22em] text-soul-accent/80 font-eskapade">
          {cta}
        </span>
      </CardContent>
      <div className="h-0.5 w-0 bg-soul-accent group-hover:w-full transition-all duration-700 ease-in-out" />
    </Card>
  );

  const className = 'block group h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soul-950';

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {card}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {card}
    </Link>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section className="py-24 relative" aria-labelledby={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`}>
      <div className="flex flex-col items-center mb-16 text-center space-y-4">
        <div className="flex items-center gap-4 w-full max-w-md opacity-50" aria-hidden="true">
          <Separator className="flex-1" />
          <div className="w-2 h-2 rotate-45 border border-soul-accent" />
          <Separator className="flex-1" />
        </div>
        <h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`} className="text-h2 font-display text-neutral-200">
          {title}
        </h2>
        {subtitle && (
          <p className="text-soul-accent/60 italic text-body max-w-2xl font-eskapade">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children}
      </div>
    </section>
  );
}

interface CtaLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  isExternal?: boolean;
  className?: string;
}

function CtaLink({ href, children, variant = 'primary', isExternal, className = '' }: CtaLinkProps) {
  const variantClassName = variant === 'primary'
    ? 'bg-soul-900 border-soul-accent/40 text-soul-accent hover:bg-soul-accent/10 hover:border-soul-accent hover:shadow-soul-glow'
    : 'bg-transparent border-midnight-light text-ash hover:border-mist hover:text-bone';
  const classes = `relative inline-flex items-center justify-center font-eskapade transition-all duration-300 border overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soul-950 ${variantClassName} ${className}`;

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export default function HomePage() {
  const [videoConsent, setVideoConsent] = useState<VideoConsent>(null);
  const [isConsentLoaded, setIsConsentLoaded] = useState(false);
  const [isVideoConsentDismissed, setIsVideoConsentDismissed] = useState(false);

  useEffect(() => {
    setVideoConsent(readVideoConsent());
    setIsConsentLoaded(true);
  }, []);

  const handleConsentChoice = (value: Exclude<VideoConsent, null>) => {
    setVideoConsentCookie(value);
    setVideoConsent(value);
    setIsVideoConsentDismissed(true);
  };

  const handleSessionDismiss = () => {
    setIsVideoConsentDismissed(true);
  };

  const shouldShowConsentModal = isConsentLoaded && videoConsent === null && !isVideoConsentDismissed;
  const hasVideoConsent = videoConsent === 'granted';

  return (
    <Layout>
      <Modal
        id="video-consent"
        isOpen={shouldShowConsentModal}
        onClose={handleSessionDismiss}
        title="Epilepsy warning + video consent"
        footer={(
          <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="h-12 px-8 text-base" onClick={() => handleConsentChoice('denied')}>
              No autoplay
            </Button>
            <Button type="button" className="h-12 px-8 text-base" onClick={() => handleConsentChoice('granted')}>
              Enable autoplay
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <p className="text-body text-neutral-300">
            The hero video contains flashing imagery. Choose whether WAGDIE may autoplay it on this device.
          </p>
          <p className="text-sm text-neutral-500">
            Explicit choices are saved in the essential <code className="text-soul-accent">{VIDEO_CONSENT_COOKIE}</code> cookie. Closing this dialog, pressing Escape, or clicking the backdrop only pauses autoplay for this browser session.
          </p>
        </div>
      </Modal>

      <section className="min-h-[80vh] flex flex-col items-center justify-center py-20 px-4 relative" aria-labelledby="homepage-hero-heading">
        <div className="animate-fade-in flex flex-col items-center w-full max-w-5xl">
          <div className="w-full mb-10">
            <AspectRatio ratio={16 / 9}>
              <VideoPlayer
                videoSrc="/videos/intro.mp4"
                posterSrc="/images/video-preview.png"
                className="w-full h-full"
                hasConsent={hasVideoConsent}
                onEnableVideo={() => handleConsentChoice('granted')}
              />
            </AspectRatio>
          </div>

          <div className="max-w-3xl text-center space-y-6 mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-soul-accent/70 font-eskapade">
              We Are All Going to Die
            </p>
            <h1 id="homepage-hero-heading" className="text-h1 font-display text-neutral-100 leading-tight">
              Enter a dark fantasy world shaped by its characters, rituals, and community choices.
            </h1>
            <p className="text-body md:text-h4 text-neutral-500 tracking-wide leading-relaxed font-eskapade">
              WAGDIE is a community-driven world where travelers explore characters, follow the map, and take part in consequences that leave a mark.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <CtaLink href="/characters" className="h-12 px-8 text-base">
              Explore Characters
            </CtaLink>
            <CtaLink href="/map" variant="secondary" className="h-12 px-8 text-base">
              Open the World Map
            </CtaLink>
          </div>
          <CtaLink href="/videos" variant="secondary" className="mt-6 h-11 px-6 text-sm">
            Watch the Low Poly Chronicles
          </CtaLink>
        </div>
      </section>

      <div className="max-w-3xl mx-auto py-12 px-4">
        <Blockquote cite="The First Pilgrim">
          The fire fades, and the words are lost. Kindle the flame to reveal what once was. We construct our own reality through the choices we make in the dark.
        </Blockquote>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <Section title="Choose your path" subtitle="Start with the systems that are alive now.">
          <FeatureCard
            title="Characters"
            description="Browse the travelers, inspect their traits, and choose whose story you want to follow into the abyss."
            imageSrc="/images/story-2.png"
            href="/characters"
            cta="Explore /characters"
          />
          <FeatureCard
            title="World Map"
            description="Survey the WAGDIE world from the dedicated map route, where exploration and location systems belong."
            imageSrc="/images/interactive-3.png"
            href="/map"
            cta="Open /map"
          />
          <FeatureCard
            title="Searing"
            description="Review the searing path and the consequences attached to the project’s darker mechanics."
            imageSrc="/images/story-1.png"
            href="/searing"
            cta="Visit /searing"
          />
        </Section>

        <Section title="Rituals and consequences" subtitle="Every action should tell you where it leads.">
          <FeatureCard
            title="Spread"
            description="Enter the ritual space for spread mechanics without pulling wallet-only flows into the homepage."
            imageSrc="/images/interactive-2.png"
            href="/spread"
            cta="Enter /spread"
          />
          <FeatureCard
            title="Low Poly Videos"
            description="Watch the latest visual chapters and use the video route when you want motion without starting the hero autoplay."
            imageSrc="/images/interactive-1.png"
            href="/videos"
            cta="Watch /videos"
          />
          {showLoreNav && (
            <FeatureCard
              title="Lore Archive"
              description="Read canon, submissions, and world records when lore navigation is enabled for this environment."
              imageSrc="/images/story-3.png"
              href="/lore"
              cta="Read /lore"
            />
          )}
          <FeatureCard
            title="WAGDIE Wiki"
            description="Use the wiki as the public reference for world details, mechanics, and lore."
            imageSrc="/images/story-3.png"
            href={WIKI_URL}
            cta="Open the wiki"
            isExternal
          />
          <FeatureCard
            title="Community Discord"
            description="Join the verified Discord invite to follow announcements, community decisions, and development updates."
            imageSrc="/images/community-1.png"
            href={DISCORD_URL}
            cta="Join Discord"
            isExternal
          />
        </Section>

        <Separator className="my-16" />

        <section className="py-16 text-center relative overflow-hidden" aria-labelledby="final-cta-heading">
          <div className="absolute inset-0 bg-soul-accent/5 blur-3xl rounded-full scale-150 opacity-20" aria-hidden="true" />

          <div className="relative z-10 space-y-8">
            <h2 id="final-cta-heading" className="text-h2 md:text-h1 font-display text-neutral-200">
              Ready to choose a path?
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-body font-eskapade">
              Start with the character index, then join Discord to follow the community decisions that keep the world moving.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <CtaLink href="/characters" className="min-w-[200px] h-14 text-body">
                Explore Characters
              </CtaLink>
              <CtaLink href={DISCORD_URL} isExternal variant="secondary" className="min-w-[200px] h-14 text-body">
                Join Discord
              </CtaLink>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
