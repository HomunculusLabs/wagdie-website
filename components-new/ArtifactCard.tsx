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
    <div className="w-full bg-soul-900 border border-neutral-800 p-6 shadow-2xl animate-fade-in relative overflow-hidden group">
        {/* Decorative inner border */}
      <div className="absolute inset-1 border border-neutral-800/50 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-4 mb-4 gap-2">
            <h2 className="text-2xl text-neutral-200 font-display uppercase tracking-wider group-hover:text-soul-accent transition-colors duration-500">
            {data.name}
            </h2>
            <span className="text-xs uppercase tracking-widest text-neutral-500 border border-neutral-800 px-2 py-1">
                {data.type}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
                <p className="italic text-neutral-400 leading-relaxed text-lg border-l-2 border-soul-accent/30 pl-4">
                    "{data.description}"
                </p>
                <div className="mt-4 p-4 bg-black/40 border border-neutral-800">
                    <h4 className="text-soul-accent text-sm font-display uppercase mb-1">Effect</h4>
                    <p className="text-neutral-300 text-sm">{data.effect}</p>
                </div>
            </div>

            <div className="col-span-1 space-y-4">
                <div className="p-4 bg-black/40 border border-neutral-800 h-full flex flex-col justify-center">
                    <h4 className="text-neutral-500 text-xs font-display uppercase mb-2 text-center">Attribute Scaling</h4>
                    <div className="text-center text-xl font-display text-neutral-300 tracking-widest">
                        {data.scaling}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
