"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Layout, Button, Card, CardHeader, CardTitle, CardContent, CardDescription, Separator, AspectRatio, Blockquote, Badge } from '@/components/ui';

// --- Video Player Component ---
const VIDEO_CONSENT_COOKIE = 'wagdie_video_consent';
const VIDEO_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

const readVideoConsent = () => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${VIDEO_CONSENT_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === 'granted' || value === 'denied' ? value : null;
};

const setVideoConsentCookie = (value: 'granted' | 'denied') => {
  document.cookie = `${VIDEO_CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${VIDEO_CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
};

const VideoPlayer = ({ videoSrc, posterSrc, className, hasConsent }: { videoSrc: string, posterSrc: string, className?: string, hasConsent: boolean }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

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
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        autoPlay={hasConsent}
        muted={hasConsent ? isMuted : true}
        loop
        playsInline
        className="w-full h-full object-cover"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
      {hasConsent && isMuted && (
        <button
          type="button"
          onClick={handleUnmute}
          className="absolute inset-0 flex items-center justify-center bg-black/45 text-neutral-100 text-sm md:text-base tracking-wide uppercase"
          aria-label="Unmute video"
        >
          <span className="sr-only">Unmute video</span>
        </button>
      )}
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  imageSrc: string;
  href: string;
  isExternal?: boolean;
}

function FeatureCard({ title, description, imageSrc, href, isExternal }: FeatureCardProps) {
  return (
    <a 
      href={href} 
      target={isExternal ? '_blank' : undefined} 
      rel={isExternal ? 'noopener noreferrer' : undefined} 
      className="block group h-full"
    >
      <Card className="h-full overflow-hidden transition-all duration-500 hover:border-soul-accent/40 hover:shadow-[0_0_30px_rgba(200,170,110,0.1)] bg-black/40 flex flex-col">
        <div className="relative h-48 overflow-hidden border-b border-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover grayscale-[50%] contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
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
        <CardContent className="flex-1">
          <CardDescription className="text-neutral-500 leading-relaxed text-body">
            {description}
          </CardDescription>
        </CardContent>
        {/* Decorative bottom line */}
        <div className="h-0.5 w-0 bg-soul-accent group-hover:w-full transition-all duration-700 ease-in-out" />
      </Card>
    </a>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section className="py-24 relative">
        {/* Section Header */}
        <div className="flex flex-col items-center mb-16 text-center space-y-4">
            <div className="flex items-center gap-4 w-full max-w-md opacity-50">
                <Separator className="flex-1" />
                <div className="w-2 h-2 rotate-45 border border-soul-accent" />
                <Separator className="flex-1" />
            </div>
            <h2 className="text-h2 font-display text-neutral-200">
                {title}
            </h2>
            {subtitle && (
                <p className="text-soul-accent/60 italic text-body max-w-2xl font-eskapade">
                    &ldquo;{subtitle}&rdquo;
                </p>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {children}
        </div>
    </section>
  );
}

export default function HomePage() {
  const [videoConsent, setVideoConsent] = useState<'granted' | 'denied' | null>(null);

  useEffect(() => {
    setVideoConsent(readVideoConsent());
  }, []);

  const handleConsent = (value: 'granted' | 'denied') => {
    setVideoConsentCookie(value);
    setVideoConsent(value);
  };

  return (
    <Layout>
      {videoConsent === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg border border-neutral-800 bg-black/90 p-8 shadow-2xl">
            <h2 className="text-h4 font-display text-neutral-100 mb-4">Epilepsy warning + cookie notice</h2>
            <p className="text-body text-neutral-400 mb-4 font-eskapade">
              This hero video contains flashing imagery. Do you want to enable autoplay?
            </p>
            <p className="text-sm text-neutral-500 mb-6 font-eskapade">
              We only use essential cookies (session, security, and your video preference). No tracking cookies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-12 px-8 text-base" onClick={() => handleConsent('granted')}>
                Enable autoplay
              </Button>
              <Button variant="secondary" className="h-12 px-8 text-base" onClick={() => handleConsent('denied')}>
                No autoplay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center py-20 px-4 relative">
        <div className="animate-fade-in flex flex-col items-center w-full max-w-5xl">
            <div className="w-full mb-12">
              <AspectRatio ratio={16/9}>
                  <VideoPlayer
                    videoSrc="/videos/intro.mp4"
                    posterSrc="/images/video-preview.png"
                    className="w-full h-full"
                    hasConsent={videoConsent === 'granted'}
                  />
              </AspectRatio>
            </div>

            <p className="text-body md:text-h4 text-neutral-500 text-center max-w-2xl tracking-wide leading-relaxed mb-12 font-eskapade">
            A community-driven dark fantasy project where your choices shape the narrative of a dying world.
            </p>

            <div className="flex gap-6">
                <Button className="h-12 px-8 text-base">Enter the Abyss</Button>
                <Button variant="secondary" className="h-12 px-8 text-base">Read the Lore</Button>
            </div>
        </div>
        
      </section>

      {/* Quote Break */}
      <div className="max-w-3xl mx-auto py-12">
        <Blockquote cite="The First Pilgrim">
            The fire fades, and the words are lost. Kindle the flame to reveal what once was. We construct our own reality through the choices we make in the dark.
        </Blockquote>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section 1: An Evolving Story */}
        <Section title="An Evolving Story" subtitle="The ink is not yet dry">
          <FeatureCard
            title="Dynamic Narrative"
            description="The story unfolds through community decisions and on-chain events. No fate is pre-written."
            imageSrc="/images/story-1.png"
            href="#"
          />
          <FeatureCard
            title="Character Growth"
            description="Watch your character grow, change, and adapt to the dark world through permanent metadata updates."
            imageSrc="/images/story-2.png"
            href="#"
          />
          <FeatureCard
            title="The Library"
            description="Access the ever-expanding archives of history, prophecy, and forgotten truths."
            imageSrc="/images/story-3.png"
            href="#"
          />
        </Section>

        {/* Section 2: Rich Interactive Elements */}
        <Section title="Rituals & Mechanics" subtitle="Actions have consequences">
          <FeatureCard
            title="Character Sheets"
            description="Full RPG attribute systems with equipment slots, background stories, and alignment tracking."
            imageSrc="/images/interactive-1.png"
            href="#"
          />
          <FeatureCard
            title="The Pyre"
            description="Participate in high-stakes mechanics. Burn assets to spread influence or save the few."
            imageSrc="/images/interactive-2.png"
            href="#"
          />
          <FeatureCard
            title="Artifacts"
            description="Collect, trade, and sear special items for permanent character effects and visual changes."
            imageSrc="/images/interactive-3.png"
            href="#"
          />
        </Section>

        {/* Section 3: Co-Created By You */}
        <Section title="The Covenant" subtitle="Governance of the Damned">
          <FeatureCard
            title="Community Vote"
            description="Vote on critical narrative decisions and shape the future of the world map."
            imageSrc="/images/community-1.png"
            href="#"
            isExternal
          />
          <FeatureCard
            title="Collaborative Lore"
            description="Submit your character's backstory to be canonized in the official world history."
            imageSrc="/images/community-2.png"
            href="#"
          />
          <FeatureCard
            title="Open Development"
            description="The path is built together. Join the development discussions and contribute to the code."
            imageSrc="/images/community-3.png"
            href="#"
            isExternal
          />
        </Section>

        <Separator className="my-16" />

        {/* CTA Footer */}
        <section className="py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-soul-accent/5 blur-3xl rounded-full scale-150 opacity-20" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-h2 md:text-h1 font-display text-neutral-200">
                Ready to Enter the Abyss?
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-body font-eskapade">
                Join thousands of travelers exploring the dark world. The flame awaits your kindling.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button variant="primary" className="min-w-[200px] h-14 text-body">
                Join Discord
                </Button>
                <Button variant="secondary" className="min-w-[200px] h-14 text-body">
                Explore Characters
                </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
