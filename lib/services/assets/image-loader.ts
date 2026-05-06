/**
 * Image loading helper
 *
 * Small utility for loading browser images with timeout handling.
 */

export function loadImageWithTimeout(
  url: string,
  timeoutMs: number,
  timeoutMessage: string = 'Asset load timeout',
  loadErrorMessage: string = 'Asset load failed'
): Promise<void> {
  if (typeof Image === 'undefined') {
    return Promise.reject(new Error('Image API is unavailable in this runtime'));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanup();
      callback();
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new Error(timeoutMessage)));
    }, timeoutMs);

    img.onload = () => {
      finish(resolve);
    };

    img.onerror = () => {
      finish(() => reject(new Error(loadErrorMessage)));
    };

    img.src = url;
  });
}
