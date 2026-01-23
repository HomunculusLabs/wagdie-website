export function dataElizaComponent(name: string): { 'data-eliza-component': string } {
  return { 'data-eliza-component': name };
}

export function dataElizaSlot(name: string): { 'data-eliza-slot': string } {
  return { 'data-eliza-slot': name };
}

export function dataElizaAttrs(
  component: string,
  slot?: string
): { 'data-eliza-component': string; 'data-eliza-slot'?: string } {
  if (slot) {
    return { 'data-eliza-component': component, 'data-eliza-slot': slot };
  }
  return { 'data-eliza-component': component };
}