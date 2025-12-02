import React from 'react';

interface LoreData {
  title: string;
  content: string;
}

interface Props {
  data: LoreData;
}

export const LoreCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full max-w-2xl mx-auto bg-black border-x border-transparent hover:border-soul-accent/20 transition-all duration-700 p-8 md:p-12 animate-fade-in text-center relative">
       {/* Top decoration */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-soul-accent/50 to-transparent"></div>

      <h2 className="text-3xl md:text-4xl text-neutral-200 font-display  tracking-widest mb-8 drop-shadow-lg">
        {data.title}
      </h2>
      
      <div className="text-lg md:text-xl text-neutral-400 leading-loose font-eskapade">
        {data.content.split('\n').map((line, i) => (
            <p key={i} className="mb-4 first-letter:text-4xl first-letter:text-soul-accent first-letter:font-display first-letter:mr-1 first-letter:float-left">
                {line}
            </p>
        ))}
      </div>

       {/* Bottom decoration */}
       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-soul-accent/50 to-transparent"></div>
    </div>
  );
};
