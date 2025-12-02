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
        <div className="absolute -inset-0.5 bg-gradient-to-t from-soul-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-1000 blur"></div>
        <div className="relative bg-black border border-neutral-800 p-1">
            <img 
                src={data.imageUrl} 
                alt={data.prompt} 
                className="w-full h-auto object-cover grayscale-[30%] contrast-125 group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <p className="text-neutral-400 text-sm font-display tracking-widest  text-center">
                    "{data.prompt}"
                </p>
            </div>
        </div>
    </div>
  );
};
