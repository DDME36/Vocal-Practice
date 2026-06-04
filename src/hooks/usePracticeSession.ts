import { useRef, useState, useCallback } from 'react';

interface ScoreData {
  hits: number;
  total: number;
  perfect: number;
  good: number;
  combo: number;
  maxCombo: number;
}

interface NoteScoreData {
  frames: number;
  perfect: number;
  good: number;
}

/**
 * Custom hook for managing practice session state and scoring logic
 * Extracted from PracticeView.tsx to reduce component complexity
 */
export function usePracticeSession() {
  const playedNotesRef = useRef<Set<number>>(new Set());
  const scoredNotesRef = useRef<Set<number>>(new Set());
  const scoreRef = useRef<ScoreData>({ hits: 0, total: 0, perfect: 0, good: 0, combo: 0, maxCombo: 0 });
  const noteScoresRef = useRef(new Map<number, NoteScoreData>());

  const [combo, setCombo] = useState(0);
  const [finalScore, setFinalScore] = useState<ScoreData>({ hits: 0, total: 0, perfect: 0, good: 0, combo: 0, maxCombo: 0 });
  const [pitchFeedback, setPitchFeedback] = useState<'perfect' | 'high' | 'low' | null>(null);

  const hasPlayedNote = useCallback((noteIndex: number) => {
    return playedNotesRef.current.has(noteIndex);
  }, []);

  const markNotePlayed = useCallback((noteIndex: number) => {
    playedNotesRef.current.add(noteIndex);
  }, []);

  const updateNoteScore = useCallback((noteIndex: number, pitchDiff: number | null) => {
    let sData = noteScoresRef.current.get(noteIndex);
    if (!sData) {
      sData = { frames: 0, perfect: 0, good: 0 };
      noteScoresRef.current.set(noteIndex, sData);
    }
    sData.frames++;

    if (pitchDiff !== null) {
      if (pitchDiff < 0.5) {
        sData.perfect++;
        setPitchFeedback('perfect');
      } else if (pitchDiff < 1.0) {
        sData.good++;
        setPitchFeedback(pitchDiff > 0 ? 'high' : 'low');
      } else {
        setPitchFeedback(pitchDiff > 0 ? 'high' : 'low');
      }
    } else {
      setPitchFeedback(null);
    }
  }, []);

  const finalizeNoteScore = useCallback((noteIndex: number) => {
    if (scoredNotesRef.current.has(noteIndex)) return;
    
    scoredNotesRef.current.add(noteIndex);
    scoreRef.current.total++;
    
    const sData = noteScoresRef.current.get(noteIndex) || { frames: 0, perfect: 0, good: 0 };
    const sPct = sData.frames > 0 ? (sData.perfect + sData.good * 0.5) / sData.frames : 0;
    
    let fQual = 'miss';
    if (sData.frames > 5) {
      if (sPct >= 0.7) fQual = 'perfect';
      else if (sPct >= 0.4) fQual = 'good';
    }
    
    if (fQual === 'miss') {
      scoreRef.current.combo = 0;
    } else {
      scoreRef.current.hits++;
      scoreRef.current.combo++;
      if (fQual === 'perfect') scoreRef.current.perfect++;
      if (fQual === 'good') scoreRef.current.good++;
      scoreRef.current.maxCombo = Math.max(scoreRef.current.combo, scoreRef.current.maxCombo);
    }
    
    setCombo(scoreRef.current.combo);
  }, []);

  const finishSession = useCallback(() => {
    const finalData = { ...scoreRef.current };
    setFinalScore(finalData);
    return finalData;
  }, []);

  const resetSession = useCallback(() => {
    scoreRef.current = { hits: 0, total: 0, perfect: 0, good: 0, combo: 0, maxCombo: 0 };
    playedNotesRef.current.clear();
    scoredNotesRef.current.clear();
    noteScoresRef.current.clear();
    setCombo(0);
    setPitchFeedback(null);
  }, []);

  const clearPitchFeedback = useCallback(() => {
    setPitchFeedback(null);
  }, []);

  const getNoteScoreData = useCallback((noteIndex: number) => {
    return noteScoresRef.current.get(noteIndex);
  }, []);

  return {
    combo,
    finalScore,
    pitchFeedback,
    hasPlayedNote,
    markNotePlayed,
    updateNoteScore,
    finalizeNoteScore,
    finishSession,
    resetSession,
    clearPitchFeedback,
    getNoteScoreData,
    currentScore: scoreRef.current
  };
}
