/**
 * YIN algorithm for pitch detection - optimized for vocal training
 * Stable, accurate, eliminates octave jumps and jitter
 */
let globalYinBuffer: Float32Array | null = null;
let maxGlobalTau = 0;

export function detectPitch(buffer: Float32Array, sampleRate: number, noiseGate: number = 0.015): number | null {
  const SIZE = buffer.length;
  const HALF_SIZE = Math.floor(SIZE / 2);

  // 1. Pre-filtering: 1st-order IIR Bandpass Filter (70Hz - 1200Hz) to remove noise
  // Low-pass: fc = 1200Hz, alpha = 0.15
  const alpha_lp = 0.15;
  const lpFiltered = new Float32Array(SIZE);
  lpFiltered[0] = buffer[0];
  for (let i = 1; i < SIZE; i++) {
    lpFiltered[i] = lpFiltered[i - 1] + alpha_lp * (buffer[i] - lpFiltered[i - 1]);
  }

  // High-pass: fc = 70Hz, alpha = 0.99
  const alpha_hp = 0.99;
  const filtered = new Float32Array(SIZE);
  filtered[0] = lpFiltered[0];
  for (let i = 1; i < SIZE; i++) {
    filtered[i] = alpha_hp * (filtered[i - 1] + lpFiltered[i] - lpFiltered[i - 1]);
  }

  // 2. Noise gate - reject silent input (calculated on filtered signal)
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += filtered[i] * filtered[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < noiseGate) return null;

  // 3. Search range: 60 Hz (low bass) to Nyquist
  const MIN_FREQ = 60;
  const MAX_TAU = Math.min(HALF_SIZE, Math.floor(sampleRate / MIN_FREQ));
  
  // Reuse buffer for performance
  if (!globalYinBuffer || maxGlobalTau < MAX_TAU) {
      globalYinBuffer = new Float32Array(MAX_TAU);
      maxGlobalTau = MAX_TAU;
  }
  const yinBuffer = globalYinBuffer;

  // 4. YIN difference function (using filtered signal)
  for (let t = 0; t < MAX_TAU; t++) {
    yinBuffer[t] = 0;
    for (let i = 0; i < SIZE - MAX_TAU; i++) {
        const delta = filtered[i] - filtered[i + t];
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
