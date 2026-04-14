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
  return new Promise((resolve, reject) => {
    const img = new Image();

    const timeout = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timeout);
      resolve();
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(loadErrorMessage));
    };

    img.src = url;
  });
}
