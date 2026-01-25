'use client'

import React, { useState } from 'react';

interface CarouselProps {
  items: React.ReactNode[];
}

export const Carousel: React.FC<CarouselProps> = ({ items }) => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % items.length);
  const prev = () => setCurrent((prev) => (prev - 1 + items.length) % items.length);

  return (
    <div className="relative w-full overflow-hidden border border-midnight-light/50 bg-midnight/30 group rounded-sm">
      <div className="relative aspect-video flex items-center justify-center p-8 backdrop-blur-sm">
        {items[current]}
      </div>
      
      {/* Controls */}
      <div className="absolute inset-y-0 left-0 flex items-center p-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={prev}
          className="bg-soul-950/80 hover:bg-soul-accent/20 text-bone p-3 border border-midnight-light/50 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-soul-accent"
          aria-label="Previous slide"
        >
          <span aria-hidden="true" className="text-xl leading-none">←</span>
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center p-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={next}
          className="bg-soul-950/80 hover:bg-soul-accent/20 text-bone p-3 border border-midnight-light/50 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-soul-accent"
          aria-label="Next slide"
        >
          <span aria-hidden="true" className="text-xl leading-none">→</span>
        </button>
      </div>
 
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
        {items.map((_, i) => (
            <button 
                key={i} 
                onClick={() => setCurrent(i)}
                className={`w-2 h-0.5 transition-all duration-500 rounded-full ${i === current ? 'w-8 bg-soul-accent' : 'bg-mist/30 hover:bg-mist/60'}`}
                aria-label={`Go to slide ${i + 1}`}
            />
        ))}
      </div>
    </div>
  );
};
