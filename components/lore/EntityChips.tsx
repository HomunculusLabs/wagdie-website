import Link from 'next/link';

interface EntityChip {
  label: string;
  href?: string;
}

interface EntityChipsProps {
  label: string;
  items: EntityChip[];
  emptyLabel?: string;
}

export function EntityChips({ label, items, emptyLabel = 'Unspecified' }: EntityChipsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => {
            const className = 'border border-midnight-light/60 bg-midnight/40 px-2.5 py-1 text-sm font-serif text-neutral-100 transition-colors hover:border-soul-accent/50 hover:text-soul-accent';

            return item.href ? (
              <Link key={`${label}-${item.label}`} href={item.href} className={className}>
                {item.label}
              </Link>
            ) : (
              <span key={`${label}-${item.label}`} className={className}>
                {item.label}
              </span>
            );
          })
        ) : (
          <span className="border border-midnight-light/40 bg-midnight/20 px-3 py-1.5 font-serif text-base text-neutral-100">
            {emptyLabel}
          </span>
        )}
      </div>
    </div>
  );
}
