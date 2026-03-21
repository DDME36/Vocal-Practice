const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export interface NoteInfo {
  name: string;
  octave: number;
  fullName: string;
  midiNumber: number;
  frequency: number;
  centsOff: number;
}

export function frequencyToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function frequencyToNote(freq: number): NoteInfo {
  const midiFloat = frequencyToMidi(freq);
  const midiRound = Math.round(midiFloat);
  const centsOff = (midiFloat - midiRound) * 100;
  const noteIndex = ((midiRound % 12) + 12) % 12;
  const octave = Math.floor(midiRound / 12) - 1;
  return {
    name: NOTE_NAMES[noteIndex],
    octave,
    fullName: `${NOTE_NAMES[noteIndex]}${octave}`,
    midiNumber: midiRound,
    frequency: midiToFrequency(midiRound),
    centsOff,
  };
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const [, noteName, octaveStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(noteName as typeof NOTE_NAMES[number]);
  const octave = parseInt(octaveStr);
  return (octave + 1) * 12 + noteIndex;
}

export function getVoiceType(lowMidi: number, highMidi: number): string {
  const midpoint = (lowMidi + highMidi) / 2;
  if (midpoint < 50) return 'Bass';
  if (midpoint < 55) return 'Baritone';
  if (midpoint < 60) return 'Tenor';
  if (midpoint < 65) return 'Alto';
  if (midpoint < 70) return 'Mezzo-Soprano';
  return 'Soprano';
}

export { NOTE_NAMES };
