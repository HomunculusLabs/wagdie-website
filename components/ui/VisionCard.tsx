import React from 'react';

interface VisionData {
  imageUrl: string;
  prompt: string;
}

interface Props {
  data: VisionData;
}

export const VisionCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full animate-fade-in group relative">
        <div className="absolute -inset-0.5 border border-soul-accent/10 opacity-0 group-hover:opacity-100 transition duration-1000 blur-sm"></div>
        <div className="relative bg-soul-950 border border-midnight-light/50 p-1.5 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={data.imageUrl}
                alt={data.prompt}
                className="w-full h-auto object-cover grayscale-[30%] contrast-125 group-hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute bottom-0 left-0 w-full bg-abyss/80 p-4 md:p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <p className="text-bone text-sm font-display tracking-widest text-center uppercase">
                    &ldquo;{data.prompt}&rdquo;
                </p>
            </div>
        </div>
    </div>
  );
};
