/**
 * iOS Audio Fix Utilities
 * Handles iOS-specific audio issues in PWA mode
 */

/**
 * Initialize audio unlock for iOS
 * Must be called from a user gesture (click/touch)
 */
export function unlockIOSAudio(): void {
  if (!isIOS()) return;

  try {
    // Create a shared AudioContext that can be reused
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    // Play silent sound to unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Store for later use
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__sharedAudioContext = ctx;
    
    console.log('iOS audio unlocked');
  } catch (e) {
    console.warn('Failed to unlock iOS audio:', e);
  }
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         !(window as any).MSStream;
}

/**
 * Check if running as PWA (standalone mode)
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (window.navigator as any).standalone === true;
}

/**
 * Setup iOS audio session for proper speaker output
 * Call this before starting audio recording/playback
 */
export function setupIOSAudioSession(): void {
  if (!isIOS()) return;
  
  if ('audioSession' in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).audioSession.type = 'play-and-record';
      console.log('iOS audio session configured for play-and-record');
    } catch (e) {
      console.warn('Failed to configure iOS audio session:', e);
    }
  }
}

/**
 * Reset iOS audio session to default
 * Call this when stopping audio
 */
export function resetIOSAudioSession(): void {
  if (!isIOS()) return;
  
  if ('audioSession' in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).audioSession.type = 'playback';
      setTimeout(() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).audioSession.type = 'auto';
        } catch (e) { /* ignore */ }
      }, 100);
    } catch (e) {
      console.warn('Failed to reset iOS audio session:', e);
    }
  }
}

/**
 * Add touch event listener to unlock audio on first interaction
 * Should be called on app initialization
 */
export function addIOSAudioUnlockListener(): void {
  if (!isIOS()) return;
  
  const unlock = () => {
    unlockIOSAudio();
    // Remove listeners after first unlock
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('touchend', unlock);
    document.removeEventListener('click', unlock);
  };
  
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('touchend', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}
