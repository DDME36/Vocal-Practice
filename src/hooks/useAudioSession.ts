import { useEffect, useRef } from 'react';
import { AudioEngine } from '../lib/audioEngine';
import { frequencyToMidi, midiToNoteName } from '../lib/noteUtils';

interface PitchEntry {
  time: number;
  midi: number;
}

/**
 * Custom hook for managing AudioEngine lifecycle and pitch detection
 * Extracted from PracticeView.tsx to reduce component complexity
 */
export function useAudioSession(
  onPitchDetected: (freq: number | null, volume: number, noteName: string) => void,
  noiseGate: number
) {
  const engineRef = useRef<AudioEngine | null>(null);
  const pitchRef = useRef<number | null>(null);
  const historyRef = useRef<PitchEntry[]>([]);

  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;
    engine.noiseGate = noiseGate;
    
    engine.onPitchDetected = (freq, vol) => {
      pitchRef.current = freq;
      
      if (freq) {
        const midi = frequencyToMidi(freq);
        const name = midiToNoteName(Math.round(midi));
        historyRef.current.push({ time: performance.now(), midi });
        if (historyRef.current.length > 200) historyRef.current.shift();
        onPitchDetected(freq, vol, name);
      } else {
        onPitchDetected(null, vol, '—');
      }
    };
    
    engine.start().catch(() => alert('Microphone access required.'));
    
    return () => {
      engine.onPitchDetected = null;
      engine.stop();
    };
  }, [onPitchDetected, noiseGate]);

  const updateNoiseGate = (val: number) => {
    if (engineRef.current) {
      engineRef.current.noiseGate = val;
    }
  };

  const resetPitchHistory = () => {
    historyRef.current = [];
    pitchRef.current = null;
  };

  return {
    engine: engineRef.current,
    currentPitch: pitchRef.current,
    pitchHistory: historyRef.current,
    updateNoiseGate,
    resetPitchHistory
  };
}
