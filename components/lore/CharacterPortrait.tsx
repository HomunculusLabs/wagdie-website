import Image from 'next/image';
import Link from 'next/link';
import type { LoreCharacter } from '@/lib/lore/types';

interface CharacterPortraitProps {
  character: LoreCharacter;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showMeta?: boolean;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-40 w-40 md:h-56 md:w-56',
};

function PortraitImage({ character, size = 'md' }: Pick<CharacterPortraitProps, 'character' | 'size'>) {
  const sizeClass = sizeClasses[size ?? 'md'];

  return (
    <div className={`${sizeClass} relative shrink-0 overflow-hidden border border-soul-accent/30 bg-soul-950/80`}>
      {character.imageUrl ? (
        <Image
          src={character.imageUrl}
          alt={character.name}
          fill
          sizes={size === 'lg' ? '224px' : size === 'md' ? '64px' : '48px'}
          className="object-cover image-render-auto"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2 text-center text-sm font-serif text-neutral-200">
          #{character.tokenId ?? '?'}
        </div>
      )}
    </div>
  );
}

export function CharacterPortrait({ character, href, size = 'md', showMeta = true }: CharacterPortraitProps) {
  const content = (
    <>
      <PortraitImage character={character} size={size} />
      {showMeta && (
        <span className="min-w-0 space-y-1">
          <span className="block truncate font-serif text-base text-neutral-50">{character.name}</span>
          <span className="block truncate font-serif text-sm uppercase tracking-[0.04em] text-neutral-200">
            {character.tokenId ? `#${character.tokenId}` : 'Character'}
            {character.characterClass ? ` / ${character.characterClass}` : ''}
          </span>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex min-w-0 items-center gap-4 border border-midnight-light/60 bg-black/30 p-3 transition-colors hover:border-soul-accent/60 hover:bg-soul-accent/10">
        {content}
      </Link>
    );
  }

  return <div className="flex min-w-0 items-center gap-4 border border-midnight-light/60 bg-black/30 p-3">{content}</div>;
}
