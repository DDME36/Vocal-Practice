/**
 * YIN algorithm for pitch detection - optimized for vocal training
 * Stable, accurate, eliminates octave jumps and jitter
 */
let globalYinBuffer: Float32Array | null = null;
let maxGlobalTau = 0;

export function detectPitch(buffer: Float32Array, sampleRate: number, noiseGate: number = 0.015): number | null {
  const SIZE = buffer.length;
  const HALF_SIZE = Math.floor(SIZE / 2);

  // 1. Noise gate - reject silent input
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < noiseGate) return null;

  // 2. Search range: 60 Hz (low bass) to Nyquist
  const MIN_FREQ = 60;
  const MAX_TAU = Math.min(HALF_SIZE, Math.floor(sampleRate / MIN_FREQ));
  
  // Reuse buffer for performance
  if (!globalYinBuffer || maxGlobalTau < MAX_TAU) {
      globalYinBuffer = new Float32Array(MAX_TAU);
      maxGlobalTau = MAX_TAU;
  }
  const yinBuffer = globalYinBuffer;

  // 3. YIN difference function
  for (let t = 0; t < MAX_TAU; t++) {
    yinBuffer[t] = 0;
    for (let i = 0; i < SIZE - MAX_TAU; i++) {
        const delta = buffer[i] - buffer[i + t];
        yinBuffer[t] += delta * delta;
    }
  }

  // 4. Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let t = 1; t < MAX_TAU; t++) {
    runningSum += yinBuffer[t];
    yinBuffer[t] = yinBuffer[t] * t / runningSum;
  }

  // 5. Absolute threshold - find first dip below threshold
  let tau = -1;
  const THRESHOLD = 0.2; // Tuned for vocal frequencies
  for (let t = 2; t < MAX_TAU; t++) {
    if (yinBuffer[t] < THRESHOLD) {
      // Find local minimum
      while (t + 1 < HALF_SIZE && yinBuffer[t + 1] < yinBuffer[t]) {
        t++;
      }
      tau = t;
      break;
    }
  }

  // Fallback: use global minimum if no threshold crossing
  if (tau === -1) {
    let minVal = 1;
    for (let t = 2; t < MAX_TAU; t++) {
       if (yinBuffer[t] < minVal) {
          minVal = yinBuffer[t];
          tau = t;
       }
    }
    // Reject if signal is too noisy/unpitched
    if (minVal > 0.5) return null;
  }

  // 6. Parabolic interpolation for sub-sample precision
  let betterTau = tau;
  if (tau > 0 && tau < HALF_SIZE - 1) {
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    if (isFinite(adjustment)) {
      betterTau = tau + adjustment;
    }
  }

  return sampleRate / betterTau;
}
