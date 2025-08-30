/**
 * Checks if the Web Audio API is supported in the current browser.
 * @returns {boolean} True if supported, false otherwise.
 */
export const isWebAudioSupported = (): boolean => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};
