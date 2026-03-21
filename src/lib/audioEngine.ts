import { detectPitch } from './pitchDetection';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrame: number | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private pitchHistory: number[] = [];
  private lastStablePitch: number | null = null;
  private stopped = false;
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];

  public noiseGate: number = 0.015;
  public onPitchDetected: ((freq: number | null, volume: number) => void) | null = null;

  async start(): Promise<void> {
    this.stopped = false;
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.source.connect(this.analyser);
    this.tick();
  }

  private tick = () => {
    if (this.stopped || !this.analyser || !this.audioContext) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyser.getFloatTimeDomainData(this.buffer as any);

    // Volume (RMS)
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) sum += this.buffer[i] * this.buffer[i];
    const volume = Math.sqrt(sum / this.buffer.length);

    const rawFreq = detectPitch(this.buffer, this.audioContext.sampleRate, this.noiseGate);

    // --- Stabilization pipeline ---
    let outputFreq: number | null = null;

    if (rawFreq !== null) {
      // 1. Octave-jump rejection: if last stable pitch exists and new pitch
      //    is roughly double or half, reject it (common mic artifact)
      if (this.lastStablePitch !== null) {
        const ratio = rawFreq / this.lastStablePitch;
        if (ratio > 1.8 && ratio < 2.2) {
          // Likely octave-up jump — use last stable
          outputFreq = this.lastStablePitch;
        } else if (ratio > 0.45 && ratio < 0.55) {
          // Likely octave-down jump — use last stable
          outputFreq = this.lastStablePitch;
        } else {
          outputFreq = rawFreq;
        }
      } else {
        outputFreq = rawFreq;
      }

      // 2. Median filter (window size 7)
      this.pitchHistory.push(outputFreq);
      if (this.pitchHistory.length > 7) this.pitchHistory.shift();

      if (this.pitchHistory.length >= 3) {
        const sorted = [...this.pitchHistory].sort((a, b) => a - b);
        outputFreq = sorted[Math.floor(sorted.length / 2)];
      }

      this.lastStablePitch = outputFreq;
    } else {
      // No pitch detected: after a few null frames, reset
      this.pitchHistory.length = 0;
      this.lastStablePitch = null;
    }

    this.onPitchDetected?.(outputFreq, volume);
    // Sync pitch detection precisely with screen refresh (60fps) for buttery smooth visual line without stutter
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  /** Play reference tone - optimized for vocal training */
  playTone(frequency: number, durationMs: number = 500, _syllable?: string) {
    if (!this.audioContext || this.audioContext.state === 'closed') return;
    const t = this.audioContext.currentTime;
    const dur = durationMs / 1000;

    // Master gain with smooth envelope
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.25, t + 0.02); // Quick attack
    masterGain.gain.setValueAtTime(0.25, t + dur - 0.05); // Sustain
    masterGain.gain.linearRampToValueAtTime(0, t + dur); // Quick release

    // Warm filter for smooth sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency * 3 + 800;
    filter.Q.value = 1;
    
    // Main tone (sine wave for pure pitch reference)
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    const gain1 = this.audioContext.createGain();
    gain1.gain.value = 1.0;
    osc1.connect(gain1).connect(filter);
    
    // Subtle octave for richness
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const gain2 = this.audioContext.createGain();
    gain2.gain.value = 0.15;
    osc2.connect(gain2).connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(this.audioContext.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.05);
    osc2.stop(t + dur + 0.05);
    
    // Track for cleanup
    this.activeOscillators.push({ osc: osc1, gain: masterGain });
    setTimeout(() => {
      const idx = this.activeOscillators.findIndex(item => item.osc === osc1);
      if (idx > -1) this.activeOscillators.splice(idx, 1);
    }, (dur + 0.1) * 1000);
    
    return { osc: osc1, gain: masterGain };
  }

  /** Fade out all currently playing tones */
  fadeOutAllTones() {
    if (!this.audioContext || this.audioContext.state === 'closed') return;
    const t = this.audioContext.currentTime;
    
    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.stop(t + 0.15);
      } catch {
        // Ignore errors
      }
    });
    
    setTimeout(() => {
      this.activeOscillators = [];
    }, 200);
  }

  stop() {
    this.stopped = true;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.fadeOutAllTones();
    this.source?.disconnect();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.mediaStream = null;
    this.pitchHistory.length = 0;
    this.lastStablePitch = null;
  }
}
