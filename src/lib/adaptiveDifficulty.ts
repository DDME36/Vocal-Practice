/**
 * Adaptive Difficulty System - ปรับความยากตามความสามารถผู้ใช้
 */

import type { Exercise, ExerciseNote } from './exercises';
import type { VocalRange } from '../lib/types';

/**
 * Adapt exercise to user's vocal range with random variation
 * Moved from App.tsx to proper location
 */
export function adaptExercise(ex: Exercise, range: VocalRange): Exercise {
  const exLow = Math.min(...ex.notes.map(n => n.midi));
  const exHigh = Math.max(...ex.notes.map(n => n.midi));
  const exSpan = exHigh - exLow;
  
  const minRoot = range.lowMidi + 3;
  let maxRoot = range.highMidi - exSpan - 2;
  
  if (maxRoot < minRoot) maxRoot = minRoot;
  
  const availableRange = Math.max(1, maxRoot - minRoot);
  const randomOffset = Math.floor(Math.random() * Math.min(availableRange, 7));
  const newRoot = Math.max(minRoot, Math.min(minRoot + randomOffset, maxRoot));
  
  const shift = newRoot - exLow;
  const bpmVariation = Math.floor(Math.random() * (ex.bpm * 0.1)) - (ex.bpm * 0.05);
  const newBpm = Math.round(ex.bpm + bpmVariation);
  const newNotes: ExerciseNote[] = ex.notes.map(n => ({ ...n, midi: n.midi + shift }));
  
  return { 
    ...ex, 
    startingNote: ex.startingNote + shift, 
    notes: newNotes,
    bpm: newBpm
  };
}

export interface AdaptiveSettings {
  bpmMultiplier: number; // 0.8 - 1.2
  rangeAdjustment: number; // -3 to +3 semitones
  patternComplexity: 'simple' | 'normal' | 'complex';
  noteCount: 'reduced' | 'normal' | 'extended';
}

/**
 * คำนวณการปรับความยากตามประสิทธิภาพ
 */
export function calculateAdaptiveSettings(
  _exerciseId: string,
  recentScores: number[], // คะแนน 3-5 ครั้งล่าสุด
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): AdaptiveSettings {
  const avgScore = recentScores.length > 0
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 50;

  let bpmMultiplier = 1.0;
  let rangeAdjustment = 0;
  let patternComplexity: 'simple' | 'normal' | 'complex' = 'normal';
  let noteCount: 'reduced' | 'normal' | 'extended' = 'normal';

  // ปรับตามคะแนนเฉลี่ย
  if (avgScore >= 90) {
    // ทำได้ดีมาก - เพิ่มความยาก
    bpmMultiplier = 1.1;
    rangeAdjustment = 1;
    patternComplexity = 'complex';
    noteCount = 'extended';
  } else if (avgScore >= 75) {
    // ทำได้ดี - ความยากปกติ
    bpmMultiplier = 1.0;
    rangeAdjustment = 0;
    patternComplexity = 'normal';
    noteCount = 'normal';
  } else if (avgScore >= 60) {
    // ทำได้พอใช้ - ลดความยากเล็กน้อย
    bpmMultiplier = 0.95;
    rangeAdjustment = 0;
    patternComplexity = 'normal';
    noteCount = 'normal';
  } else {
    // ทำได้ยาก - ลดความยาก
    bpmMultiplier = 0.85;
    rangeAdjustment = -1;
    patternComplexity = 'simple';
    noteCount = 'reduced';
  }

  // ปรับตามระดับทักษะ
  if (skillLevel === 'beginner') {
    bpmMultiplier *= 0.9;
    if (rangeAdjustment > 0) rangeAdjustment = 0;
  } else if (skillLevel === 'advanced') {
    bpmMultiplier *= 1.05;
  }

  return {
    bpmMultiplier: Math.max(0.8, Math.min(1.2, bpmMultiplier)),
    rangeAdjustment: Math.max(-3, Math.min(3, rangeAdjustment)),
    patternComplexity,
    noteCount
  };
}

/**
 * ปรับ exercise ตาม adaptive settings
 */
export function applyAdaptiveSettings(
  exercise: Exercise,
  settings: AdaptiveSettings,
  vocalRange: VocalRange | null
): Exercise {
  const adapted = { ...exercise };

  // ปรับ BPM
  adapted.bpm = Math.round(exercise.bpm * settings.bpmMultiplier);

  // ปรับช่วงเสียง
  if (vocalRange) {
    const exLow = Math.min(...exercise.notes.map(n => n.midi));
    const exHigh = Math.max(...exercise.notes.map(n => n.midi));
    const exSpan = exHigh - exLow;

    // คำนวณคีย์ที่เหมาะสม
    const minRoot = vocalRange.lowMidi + 3 + settings.rangeAdjustment;
    let maxRoot = vocalRange.highMidi - exSpan - 2 + settings.rangeAdjustment;

    if (maxRoot < minRoot) {
      maxRoot = minRoot;
    }

    // เลือกคีย์ตรงกลางช่วง
    const targetRoot = Math.floor((minRoot + maxRoot) / 2);
    const shift = targetRoot - exLow;

    // ปรับโน้ตทั้งหมด
    adapted.notes = exercise.notes.map(n => ({
      ...n,
      midi: n.midi + shift
    }));
    adapted.startingNote = exercise.startingNote + shift;
  }

  // ปรับจำนวนโน้ต
  if (settings.noteCount === 'reduced') {
    // ลดจำนวนรอบซ้ำ
    const totalBeats = Math.max(...adapted.notes.map(n => n.startBeat + n.durationBeats));
    const targetBeats = totalBeats * 0.7;
    adapted.notes = adapted.notes.filter(n => n.startBeat < targetBeats);
  } else if (settings.noteCount === 'extended') {
    // เพิ่มรอบซ้ำ (ไม่ implement ในเวอร์ชันนี้เพื่อความเรียบง่าย)
  }

  return adapted;
}

/**
 * แนะนำ BPM ที่เหมาะสมสำหรับผู้เริ่มต้น
 */
export function getRecommendedBPM(
  baseBPM: number,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  category: string
): number {
  let multiplier = 1.0;

  // ปรับตามระดับ
  if (skillLevel === 'beginner') {
    multiplier = 0.85;
  } else if (skillLevel === 'advanced') {
    multiplier = 1.1;
  }

  // ปรับตามหมวดหมู่
  if (category === 'WARM-UPS' || category === 'BREATHING') {
    multiplier *= 0.9; // ช้าลงเพื่อให้ผ่อนคลาย
  } else if (category === 'RUNS' || category === 'ARTICULATION') {
    // ใช้ความเร็วปกติ
  }

  return Math.round(baseBPM * multiplier);
}

/**
 * ประเมินว่าบทเรียนนี้เหมาะกับผู้ใช้หรือไม่
 */
export function isExerciseSuitable(
  exercise: Exercise,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  vocalRange: VocalRange | null
): { suitable: boolean; reason?: string } {
  // ตรวจสอบระดับความยาก
  if (exercise.difficulty) {
    if (skillLevel === 'beginner' && exercise.difficulty === 'advanced') {
      return { suitable: false, reason: 'บทเรียนนี้ยากเกินไปสำหรับระดับเริ่มต้น' };
    }
  }

  // ตรวจสอบช่วงเสียง
  if (vocalRange) {
    const exLow = Math.min(...exercise.notes.map(n => n.midi));
    const exHigh = Math.max(...exercise.notes.map(n => n.midi));

    if (exHigh - exLow > vocalRange.highMidi - vocalRange.lowMidi + 4) {
      return { suitable: false, reason: 'บทเรียนนี้ใช้ช่วงเสียงกว้างเกินไป' };
    }
  }

  return { suitable: true };
}

/**
 * สร้างคำแนะนำสำหรับการฝึก
 */
export function generatePracticeTips(
  exercise: Exercise,
  recentScore: number | null
): string[] {
  const tips: string[] = [];

  // คำแนะนำทั่วไปตามหมวดหมู่
  switch (exercise.category) {
    case 'WARM-UPS':
      tips.push('ผ่อนคลายคอและไหล่ก่อนเริ่ม');
      tips.push('อย่าร้องเต็มเสียง ให้ร้องเบาๆ เพื่อวอร์มเส้นเสียง');
      break;
    case 'SCALES':
      tips.push('ฟังเสียงอ้างอิงให้ดีก่อนร้องตาม');
      tips.push('รักษาระดับเสียงให้คงที่ตลอดสเกล');
      break;
    case 'RUNS':
      tips.push('เริ่มช้าๆ ก่อน แล้วค่อยเพิ่มความเร็ว');
      tips.push('ใช้กะบังลมพยุงเสียงทุกโน้ต');
      break;
    case 'BREATHING':
      tips.push('หายใจลึกจากกะบังลม ไม่ใช่จากหน้าอก');
      tips.push('ปล่อยลมออกช้าๆ และสม่ำเสมอ');
      break;
    case 'ARPEGGIOS':
      tips.push('เปิดคอกว้างเมื่อกระโดดโน้ต');
      tips.push('อย่าบีบคอเมื่อขึ้นโน้ตสูง');
      break;
  }

  // คำแนะนำตามผลการฝึก
  if (recentScore !== null) {
    if (recentScore < 60) {
      tips.push('ลองฝึกช้าๆ ก่อน เน้นความแม่นยำของตัวโน้ตและความผ่อนคลายของลำคอมากกว่าความเร็ว');
      tips.push('ตั้งใจฟังเสียงเปียโนอ้างอิงซ้ำๆ จนจับคู่ระดับเสียงได้อย่างมั่นใจ');
    } else if (recentScore >= 90) {
      tips.push('ทำได้ยอดเยี่ยมมาก! ลองเพิ่มความเร็ว (BPM) หรือท้าทายตัวเองในระดับเสียงที่กว้างขึ้น');
    }
  }

  return tips;
}
