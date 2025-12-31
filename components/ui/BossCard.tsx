import React from 'react';

interface BossData {
  name: string;
  epithet: string;
  description: string;
  location: string;
  health: number | string;
  weaknesses: string[];
  resistances: string[];
  souls: number | string;
  phases?: string[];
}

interface Props {
  data: BossData;
}

export const BossCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full bg-soul-950 border-y-4 border-midnight-light/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in relative overflow-hidden">
      
      {/* Boss Health Bar Decoration */}
      <div className="w-full h-2 bg-midnight border-b border-abyss flex justify-center items-center mb-6 px-12 pt-8">
        <div className="w-full max-w-4xl h-3 bg-red-900/40 border border-red-900/60 relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full w-[100%] bg-red-800 shadow-[0_0_10px_rgba(153,27,27,0.6)]"></div>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl text-bone font-display tracking-widest drop-shadow-2xl uppercase">
                {data.name}
            </h2>
            <p className="text-soul-accent/80 text-sm md:text-base tracking-[0.2em] font-display mt-2 border-b border-soul-accent/20 inline-block pb-1 px-4 uppercase">
                {data.epithet}
            </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
                 <p className="italic text-ash leading-relaxed text-lg text-justify font-eskapade">
                    {data.description}
                </p>
                <div className="flex justify-between items-center text-[10px] font-display text-mist border-t border-midnight-light/20 pt-4 uppercase tracking-widest">
                     <span>Loc: {data.location}</span>
                     <span>HP: {data.health}</span>
                </div>
            </div>

            <div className="space-y-4 text-sm">
                  {/* Weaknesses */}
                 <div className="bg-midnight/30 border border-midnight-light/30 p-4">
                    <h4 className="text-blood/80 font-display tracking-widest mb-2 text-xs uppercase">Weaknesses</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.weaknesses.map((w, i) => (
                            <span key={i} className="text-bone px-2 py-0.5 bg-midnight border border-midnight-light/50 text-xs font-eskapade uppercase tracking-widest">{w}</span>
                        ))}
                    </div>
                 </div>
                 
                 {/* Resistances */}
                 <div className="bg-midnight/30 border border-midnight-light/30 p-4">
                    <h4 className="text-mist font-display tracking-widest mb-2 text-xs uppercase">Resistances</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.resistances.map((r, i) => (
                            <span key={i} className="text-mist px-2 py-0.5 bg-midnight border border-midnight-light/50 text-xs font-eskapade uppercase tracking-widest">{r}</span>
                        ))}
                    </div>
                 </div>

                 {/* Reward */}
                 <div className="text-right">
                    <span className="text-soul-accent font-display text-xl tracking-wider uppercase drop-shadow-glow">{data.souls} Runes</span>
                 </div>
            </div>
        </div>

        {/* Phases */}
        {data.phases && data.phases.length > 0 && (
            <div className="mt-8 pt-8 border-t border-midnight-light/20">
                <h3 className="text-center font-display text-mist tracking-widest text-xs mb-6 uppercase">Combat Phases</h3>
                <div className="space-y-4">
                    {data.phases.map((phase, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-soul-accent font-display text-2xl opacity-30">{['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span>
                            <p className="text-ash font-eskapade leading-relaxed">{phase}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
