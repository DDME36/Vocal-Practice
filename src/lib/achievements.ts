import type { UserProgress } from './progressionSystem';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string; // Used to map to Lucide icons (e.g. "Music", "Trophy")
  requirementText: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_practice',
    name: 'ก้าวแรกสู่ดวงดาว',
    description: 'สำเร็จการฝึกซ้อมบทเรียนแรกของคุณ',
    iconName: 'Music',
    requirementText: 'สำเร็จบทฝึกซ้อมอย่างน้อย 1 ครั้ง'
  },
  {
    id: 'streak_3',
    name: 'ผู้ฝึกซ้อมสม่ำเสมอ',
    description: 'รักษาจังหวะการเรียนรู้ได้อย่างต่อเนื่อง',
    iconName: 'Flame',
    requirementText: 'ฝึกซ้อมติดต่อกัน 3 วัน'
  },
  {
    id: 'streak_7',
    name: 'วินัยเหล็กกล้า',
    description: 'มีความรับผิดชอบต่อการพัฒนาเสียงของตนเองอย่างสูง',
    iconName: 'Trophy',
    requirementText: 'ฝึกซ้อมติดต่อกัน 7 วัน'
  },
  {
    id: 'perfect_100',
    name: 'ระดับเสียงไร้ที่ติ',
    description: 'ร้องตัวโน้ตได้ตรงระดับคีย์ 100% สมบูรณ์แบบ',
    iconName: 'Award',
    requirementText: 'ได้คะแนนความแม่นยำ 100% ในบทเรียนใดๆ'
  },
  {
    id: 'combo_20',
    name: 'จังหวะต่อเนื่องลื่นไหล',
    description: 'ควบคุมลมและเสียงร้องได้ต่อเนื่องยาวนาน',
    iconName: 'Zap',
    requirementText: 'ทำคอมโบต่อเนื่องสูงสุด 20 ครั้งขึ้นไป'
  },
  {
    id: 'combo_50',
    name: 'ราชาความต่อเนื่อง',
    description: 'ประคองเสียงร้องได้อย่างนิ่งสนิทเป็นระยะเวลานาน',
    iconName: 'Sparkles',
    requirementText: 'ทำคอมโบต่อเนื่องสูงสุด 50 ครั้งขึ้นไป'
  },
  {
    id: 'level_intermediate',
    name: 'นักร้องฝึกหัด',
    description: 'พัฒนาเสียงร้องสู่ระดับปานกลาง',
    iconName: 'Sliders',
    requirementText: 'ก้าวเข้าสู่ระดับทักษะปานกลาง (Intermediate)'
  },
  {
    id: 'level_advanced',
    name: 'ผู้ชำนาญเสียงร้อง',
    description: 'บรรลุระดับทักษะขั้นสูงสุดในเส้นทางฝึกฝน',
    iconName: 'Crown',
    requirementText: 'ก้าวเข้าสู่ระดับทักษะขั้นสูง (Advanced)'
  },
  {
    id: 'range_measured',
    name: 'ทำความรู้จักเสียงตนเอง',
    description: 'ตรวจวัดระดับช่วงเสียงร้องต่ำสุดและสูงสุดสำเร็จ',
    iconName: 'Mic',
    requirementText: 'ทำการประเมินช่วงระดับเสียงร้อง (Vocal Range) สำเร็จ'
  }
];

/**
 * Check and return all achievements that should be unlocked based on progress state
 */
export function checkAchievements(
  progress: UserProgress,
  latestStats?: { score: number; maxCombo: number }
): string[] {
  const unlocked: string[] = [];

  // 1. First practice
  if (progress.completedExercises.length >= 1) {
    unlocked.push('first_practice');
  }

  // 2. Streak 3
  if (progress.currentStreak >= 3) {
    unlocked.push('streak_3');
  }

  // 3. Streak 7
  if (progress.currentStreak >= 7) {
    unlocked.push('streak_7');
  }

  // 4. Perfect 100
  const hasPerfectScore = Object.values(progress.exerciseScores).some(
    score => score.bestScore === 100
  ) || (latestStats && latestStats.score === 100);
  if (hasPerfectScore) {
    unlocked.push('perfect_100');
  }

  // 5. Combo 20
  const hasCombo20 = Object.values(progress.exerciseScores).some(
    // (legacy check or via latest stats)
    _ => false // We'll rely on global stats or latestStats
  ) || (latestStats && latestStats.maxCombo >= 20);
  if (hasCombo20) {
    unlocked.push('combo_20');
  }

  // 6. Combo 50
  const hasCombo50 = latestStats && latestStats.maxCombo >= 50;
  if (hasCombo50) {
    unlocked.push('combo_50');
  }

  // 7. Level Intermediate
  if (progress.skillLevel === 'intermediate' || progress.skillLevel === 'advanced') {
    unlocked.push('level_intermediate');
  }

  // 8. Level Advanced
  if (progress.skillLevel === 'advanced') {
    unlocked.push('level_advanced');
  }

  // 9. Range measured
  // We'll unlock this externally by dispatching when the range is saved
  try {
    const range = localStorage.getItem('vocal-practice-settings');
    if (range) {
      const parsed = JSON.parse(range);
      if (parsed.state?.vocalRange) {
        unlocked.push('range_measured');
      }
    }
  } catch {
    // Ignore issues checking local storage
  }

  return unlocked;
}
