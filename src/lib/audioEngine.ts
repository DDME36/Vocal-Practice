import { detectPitch } from './pitchDetection';
import { setupIOSAudioSession, resetIOSAudioSession } from './iosAudioFix';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null; // แยก context สำหรับเล่นเสียง
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

    // iOS BUG FIX: Create AudioContext synchronously BEFORE any `await`
    // to ensure it captures the user gesture token and doesn't get stuck suspended.
    if (!this.audioContext || this.audioContext.state === 'closed') {
      try {
        // Use the globally shared context created from the click handler if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sharedCtx = (window as any).__sharedAudioContext;
        if (sharedCtx) {
          this.audioContext = sharedCtx;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).__sharedAudioContext = null; // Consume it
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // A synchronous resume attempt while the gesture is still active
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      } catch (e) {
        console.warn('Failed to start AudioContext synchronously:', e);
      }
    }

    // iOS Safari Fix: Setup audio session for proper speaker output
    setupIOSAudioSession();
    
    // Request microphone permission first
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: false, 
        noiseSuppression: false, 
        autoGainControl: false,
        // iOS specific settings
        sampleRate: 44100,
        channelCount: 1
      },
    });
    
    // Ensure we have a context at this point
    if (!this.audioContext) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // iOS: Final resume attempt if still suspended
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
    }
    
    // iOS PWA Fix: Play silent sound to unlock audio output
    // This is critical for PWA to work properly on iOS
    try {
      const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
      const silentSource = this.audioContext.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(this.audioContext.destination);
      silentSource.start(0);
    } catch (e) {
      console.warn('Failed to play silent sound:', e);
    }
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3; // Reduce noise on iOS
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
  async playTone(frequency: number, durationMs: number = 500, _syllable?: string, timeOffsetSec: number = 0, _enableSpeech: boolean = false) {
    // ใช้ playbackContext แยกจาก audioContext (ไม่ต้องขอไมค์)
    let context = this.playbackContext;
    
    if (!context) {
      // สร้าง AudioContext ใหม่สำหรับเล่นเสียงเท่านั้น (ไม่ต้องขอไมค์)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.playbackContext = context;
      
      // iOS PWA Fix: Play silent sound immediately to unlock audio
      try {
        const silentBuffer = context.createBuffer(1, 1, 22050);
        const silentSource = context.createBufferSource();
        silentSource.buffer = silentBuffer;
        silentSource.connect(context.destination);
        silentSource.start(0);
      } catch (e) {
        console.warn('Failed to unlock audio:', e);
      }
    }
    
    // iOS: Resume AudioContext if suspended
    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch (e) {
        console.warn('Failed to resume audio context:', e);
        return;
      }
    }
    
    if (context.state === 'closed') return;
    
    const t = context.currentTime + timeOffsetSec;
    const dur = durationMs / 1000;

    // Web Speech API has been disabled per user request
    // Speech synthesis is no longer used in this application

    // Master gain with smooth electric piano/vocal guide envelope
    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0, Math.max(0, t));
    masterGain.gain.linearRampToValueAtTime(0.4, Math.max(0, t + 0.02)); // Attack
    masterGain.gain.exponentialRampToValueAtTime(0.15, Math.max(0, t + dur - 0.05)); // Decay to sustain
    masterGain.gain.linearRampToValueAtTime(0, Math.max(0, t + dur)); // Release

    // Formant-like filter for smooth sound
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency * 4;
    filter.Q.value = 0.5;
    
    // Main tone (Triangle for warm body)
    const osc1 = context.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = frequency;
    const gain1 = context.createGain();
    gain1.gain.value = 0.8;
    osc1.connect(gain1).connect(filter);
    
    // Richness (Sine, octave up)
    const osc2 = context.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const gain2 = context.createGain();
    gain2.gain.value = 0.3;
    osc2.connect(gain2).connect(filter);

    // Tine/Bell attack (Sine, 1.5 octaves up with fast decay)
    const osc3 = context.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 3;
    const gain3 = context.createGain();
    gain3.gain.setValueAtTime(0, Math.max(0, t));
    gain3.gain.linearRampToValueAtTime(0.2, Math.max(0, t + 0.01));
    gain3.gain.exponentialRampToValueAtTime(0.001, Math.max(0, t + 0.15));
    osc3.connect(gain3).connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(context.destination);

    osc1.start(Math.max(0, t));
    osc2.start(Math.max(0, t));
    osc3.start(Math.max(0, t));
    osc1.stop(Math.max(0, t + dur + 0.05));
    osc2.stop(Math.max(0, t + dur + 0.05));
    osc3.stop(Math.max(0, t + dur + 0.05));
    
    // Track for cleanup
    this.activeOscillators.push({ osc: osc1, gain: masterGain });
    setTimeout(() => {
      const idx = this.activeOscillators.findIndex(item => item.osc === osc1);
      if (idx > -1) this.activeOscillators.splice(idx, 1);
    }, (dur + timeOffsetSec + 0.1) * 1000);
    
    return { osc: osc1, gain: masterGain };
  }

  /** Fade out all currently playing tones */
  fadeOutAllTones() {
    const context = this.playbackContext || this.audioContext;
    if (!context || context.state === 'closed') return;
    const t = context.currentTime;
    
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
    
    // Fixed #3: Clear activeOscillators immediately to prevent memory leak
    this.activeOscillators = [];
    
    this.source?.disconnect();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    
    // ปิด audioContext (สำหรับ recording)
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    // iOS Safari Fix: Reset audio session to default
    resetIOSAudioSession();
    
    // ไม่ปิด playbackContext เพื่อให้ preview ใช้ต่อได้
    // if (this.playbackContext && this.playbackContext.state !== 'closed') {
    //   this.playbackContext.close().catch(() => {});
    // }
    
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.mediaStream = null;
    this.pitchHistory.length = 0;
    this.lastStablePitch = null;
  }
}
