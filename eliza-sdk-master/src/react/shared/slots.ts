import type React from 'react';

export type SlotClassNames<TSlots extends string> = Partial<Record<TSlots, string>>;

export type SlotStyles<TSlots extends string> = Partial<Record<TSlots, React.CSSProperties>>;

export type SlotStyleProps<TSlots extends string> = {
  classNames?: SlotClassNames<TSlots>;
  styles?: SlotStyles<TSlots>;
  unstyled?: boolean;
};