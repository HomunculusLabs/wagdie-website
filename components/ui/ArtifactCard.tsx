import React from 'react';

interface ArtifactData {
  name: string;
  type: string;
  description: string;
  effect: string;
  scaling: string;
}

interface Props {
  data: ArtifactData;
}

export const ArtifactCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full bg-soul-950/60 backdrop-blur-md border border-midnight-light/50 p-6 shadow-2xl animate-fade-in relative overflow-hidden group rounded-sm">
        {/* Decorative inner border */}
      <div className="absolute inset-1 border border-midnight-light/20 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-midnight-light/30 pb-4 mb-4 gap-2">
            <h2 className="text-2xl text-bone font-display tracking-wider group-hover:text-soul-accent transition-colors duration-500 uppercase">
            {data.name}
            </h2>
            <span className="text-[10px] tracking-widest text-mist border border-midnight-light/50 px-2 py-0.5 uppercase font-eskapade">
                {data.type}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
                <p className="italic text-ash leading-relaxed text-lg border-l-2 border-soul-accent/30 pl-4 font-eskapade">
                    &ldquo;{data.description}&rdquo;
                </p>
                <div className="mt-4 p-4 bg-midnight/40 border border-midnight-light/30">
                    <h4 className="text-soul-accent text-xs font-display tracking-widest mb-1 uppercase">Effect</h4>
                    <p className="text-bone text-sm font-eskapade">{data.effect}</p>
                </div>
            </div>

            <div className="col-span-1 space-y-4">
                <div className="p-4 bg-midnight/40 border border-midnight-light/30 h-full flex flex-col justify-center">
                    <h4 className="text-mist text-[10px] font-display tracking-widest mb-2 text-center uppercase">Attribute Scaling</h4>
                    <div className="text-center text-xl font-display text-soul-accent tracking-widest drop-shadow-glow">
                        {data.scaling}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
