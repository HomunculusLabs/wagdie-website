/**
 * Body Scroll Lock
 * Ref-counted scroll locking to prevent multiple overlays/drawers fighting over body overflow.
 *
 * API:
 *  - lockBodyScroll(lockId: string): void
 *  - unlockBodyScroll(lockId: string): void
 *
 * Behavior:
 *  - Uses a module-level Set of active lock IDs.
 *  - Only mutates document.body.style.overflow when transitioning from 0→1 (lock) or 1→0 (unlock).
 *  - Captures and restores the previous inline overflow style.
 *  - Safe for SSR (no document access when undefined).
 */

const activeLocks = new Set<string>()
let previousBodyOverflow: string | null = null

function canUseDOM(): boolean {
  return typeof document !== 'undefined' && !!document.body
}

export function lockBodyScroll(lockId: string): void {
  if (!lockId) return
  if (!canUseDOM()) return

  const wasEmpty = activeLocks.size === 0
  activeLocks.add(lockId)

  if (!wasEmpty) return

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

export function unlockBodyScroll(lockId: string): void {
  if (!lockId) return
  if (!canUseDOM()) return

  const hadLock = activeLocks.delete(lockId)
  if (!hadLock) return

  if (activeLocks.size > 0) return

  document.body.style.overflow = previousBodyOverflow ?? ''
  previousBodyOverflow = null
}