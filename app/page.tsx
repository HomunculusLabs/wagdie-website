/**
 * Home Page
 * Landing page introducing WAGDIE with video, content sections, and CTAs
 */

import Image from 'next/image'
import { VideoPlayer } from '@/components/home/VideoPlayer'
import { HomeCard } from '@/components/home/HomeCard'
import { HomeCardRow } from '@/components/home/HomeCardRow'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Logo */}
      <section className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative w-64 h-64 mb-8">
          <Image
            src="/images/wagdie-logo.png"
            alt="WAGDIE Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-bone text-center mb-4">
          We Are All Going to Die
        </h1>
        <p className="text-xl text-ash text-center max-w-2xl">
          A community-driven dark fantasy NFT project where your choices shape the narrative
        </p>
      </section>

      {/* Video Section */}
      <section className="container mx-auto px-4 py-12">
        <VideoPlayer
          videoSrc="/videos/intro.mp4"
          posterSrc="/images/video-preview.png"
          className="max-w-4xl mx-auto"
        />
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-4">
        {/* Section 1: An Evolving Story */}
        <HomeCardRow title="An Evolving Story">
          <HomeCard
            title="Dynamic Narrative"
            description="The story unfolds through community decisions and on-chain events"
            imageSrc="/images/story-1.png"
            href="/lore"
          />
          <HomeCard
            title="Character Development"
            description="Watch your character grow, change, and adapt to the dark world"
            imageSrc="/images/story-2.png"
            href="/characters"
          />
          <HomeCard
            title="Lore Feed"
            description="Follow the official narrative through tweets and announcements"
            imageSrc="/images/story-3.png"
            href="/lore"
          />
        </HomeCardRow>

        {/* Section 2: Rich Interactive Elements */}
        <HomeCardRow title="Rich Interactive Elements">
          <HomeCard
            title="Character Sheets"
            description="D&D-style attributes with equipment and background stories"
            imageSrc="/images/interactive-1.png"
            href="/characters"
          />
          <HomeCard
            title="Spread Infection"
            description="Participate in game mechanics by burning corpses and spreading the plague"
            imageSrc="/images/interactive-2.png"
            href="/spread"
          />
          <HomeCard
            title="Concords & Items"
            description="Collect and sear special items for permanent character effects"
            imageSrc="/images/interactive-3.png"
            href="/characters"
          />
        </HomeCardRow>

        {/* Section 3: Co-Created By You */}
        <HomeCardRow title="Co-Created By You">
          <HomeCard
            title="Community Governance"
            description="Vote on narrative decisions and shape the world's future"
            imageSrc="/images/community-1.png"
            href="https://discord.gg/wagdie"
            isExternal
          />
          <HomeCard
            title="Collaborative Lore"
            description="Contribute your character's story to the collective narrative"
            imageSrc="/images/community-2.png"
            href="/characters"
          />
          <HomeCard
            title="Open Development"
            description="Built with transparency and community feedback"
            imageSrc="/images/community-3.png"
            href="https://twitter.com/WAGDIE_ETH"
            isExternal
          />
        </HomeCardRow>

        {/* CTA Section */}
        <section className="py-16 text-center">
          <h2 className="text-4xl font-bold text-bone mb-8">Ready to Enter the Abyss?</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <HomeCard
              title="Join Discord"
              description="Connect with the community and stay updated"
              imageSrc="/images/cta-discord.png"
              href="https://discord.gg/wagdie"
              isExternal
              className="max-w-sm"
            />
            <HomeCard
              title="Get In Character"
              description="Explore your WAGDIE tokens and customize them"
              imageSrc="/images/cta-characters.png"
              href="/characters"
              className="max-w-sm"
            />
          </div>
        </section>
      </div>
    </main>
  )
}
