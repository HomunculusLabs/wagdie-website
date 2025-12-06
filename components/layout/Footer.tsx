/**
 * Footer Component
 * Site footer with external links to community resources and copyright information.
 */

import React from 'react';

export function Footer() {
  const externalLinks = [
    {
      label: 'Discord',
      url: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/wagdie',
    },
    {
      label: 'OpenSea',
      url: process.env.NEXT_PUBLIC_OPENSEA_URL || 'https://opensea.io/collection/wagdie',
    },
    {
      label: 'Twitter',
      url: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/WAGDIE_ETH',
    },
  ];

  return (
    <footer className="bg-soul-950 border-t border-neutral-800 mt-auto relative">
      {/* Top decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-soul-accent/30 to-transparent" />

      <div className="container mx-auto px-4 py-8">
        {/* External Links */}
        <div className="flex justify-center gap-8 flex-wrap mb-6">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-soul-accent transition-colors duration-300 min-h-[44px] flex items-center font-display text-lg"
            >
              {link.label}
              <svg className="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center w-full mb-6 opacity-40">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
          <div className="mx-3 text-neutral-700">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="rotate-45">
              <rect width="8" height="8" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
        </div>

        {/* Copyright and Description */}
        <p className="text-center text-neutral-700 text-xs font-body">
          © 2025 WAGDIE. Community-driven dark fantasy NFT project.
        </p>
      </div>
    </footer>
  );
}
