'use client'

import React, { useState } from 'react';
import { Button } from './Button';

interface CarouselProps {
  items: React.ReactNode[];
}

export const Carousel: React.FC<CarouselProps> = ({ items }) => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % items.length);
  const prev = () => setCurrent((prev) => (prev - 1 + items.length) % items.length);

  return (
    <div className="relative w-full overflow-hidden border border-neutral-800 bg-black/40 group">
      <div className="relative aspect-video flex items-center justify-center p-8">
        {items[current]}
      </div>
      
      {/* Controls */}
      <div className="absolute inset-y-0 left-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={prev} className="bg-black/50 hover:bg-soul-accent/20 text-neutral-200 p-2 border border-neutral-700">
            ←
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={next} className="bg-black/50 hover:bg-soul-accent/20 text-neutral-200 p-2 border border-neutral-700">
            →
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
        {items.map((_, i) => (
            <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${i === current ? 'bg-soul-accent' : 'bg-neutral-700'}`}
            />
        ))}
      </div>
    </div>
  );
};
