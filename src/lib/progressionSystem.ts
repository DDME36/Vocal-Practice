/**
 * Progression System - ระบบติดตามความก้าวหน้าและแนะนำบทเรียนที่เหมาะสม
 */

import { checkAchievements } from './achievements';


export interface PracticeSessionRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  score: number;
  perfectCount: number;
  goodCount: number;
  totalNotes: number;
  date: string;
}

export interface UserProgress {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  completedExercises: string[]; // exercise IDs
  exerciseScores: Record<string, ExerciseScore>;
  currentStreak: number;
  totalPracticeTime: number; // minutes
  lastPracticeDate: string;
  weakAreas: string[]; // categories that need improvement
  strongAreas: string[]; // categories user excels at
  recommendedExercises: string[]; // exercise IDs
  unlockedAchievements: string[];
  practiceHistory: PracticeSessionRecord[];
}

export interface ExerciseScore {
  exerciseId: string;
  attempts: number;
  bestScore: number;
  lastScore: number;
  averageScore: number;
  lastAttemptDate: string;
  perfectCount: number;
  goodCount: number;
  totalNotes: number;
}

/**
 * คำนวณคะแนนความสามารถในแต่ละหมวดหมู่
 * Fixed #6: Use actual category from EXERCISES instead of ID prefix
 */
export function calculateCategoryMastery(
  category: string,
  exerciseScores: Record<string, ExerciseScore>,
  allExercises: { id: string; category: string }[]
): number {
  // Build a map of exerciseId -> category
  const exerciseCategoryMap = new Map(allExercises.map(ex => [ex.id, ex.category]));
  
  // Filter scores by actual category
  const categoryExercises = Object.values(exerciseScores).filter(
    score => exerciseCategoryMap.get(score.exerciseId) === category
  );

  if (categoryExercises.length === 0) return 0;

  const totalScore = categoryExercises.reduce((sum, score) => sum + score.averageScore, 0);
  return Math.round(totalScore / categoryExercises.length);
}

/**
 * แนะนำบทเรียนถัดไปตามความสามารถ
 */
export function getRecommendedExercises(
  progress: UserProgress,
  allExerciseIds: string[]
): string[] {
  const { completedExercises, exerciseScores, weakAreas } = progress;

  // 1. หาบทเรียนที่ยังไม่เคยทำ
  const untriedExercises = allExerciseIds.filter(
    id => !completedExercises.includes(id)
  );

  // 2. หาบทเรียนที่ทำได้ไม่ดี (คะแนนต่ำกว่า 70%)
  const needsImprovement = Object.values(exerciseScores)
    .filter(score => score.averageScore < 70 && score.attempts > 0)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3)
    .map(score => score.exerciseId);

  // 3. หาบทเรียนในหมวดที่อ่อน
  const weakCategoryExercises = allExerciseIds.filter(id => {
    const category = id.split('-')[0];
    return weakAreas.includes(category);
  });

  // 4. รวมและจัดลำดับความสำคัญ
  const recommended = [
    ...needsImprovement,
    ...weakCategoryExercises.slice(0, 2),
    ...untriedExercises.slice(0, 5)
  ];

  // ลบรายการซ้ำ
  return [...new Set(recommended)].slice(0, 10);
}

/**
 * ประเมินว่าควรเลื่อนระดับหรือไม่
 */
export function shouldLevelUp(progress: UserProgress): boolean {
  const { skillLevel, exerciseScores, completedExercises } = progress;

  // ต้องทำบทเรียนอย่างน้อย 10 บท
  if (completedExercises.length < 10) return false;

  // คำนวณคะแนนเฉลี่ย
  const scores = Object.values(exerciseScores);
  if (scores.length === 0) return false;

  const avgScore = scores.reduce((sum, s) => sum + s.averageScore, 0) / scores.length;

  // เงื่อนไขการเลื่อนระดับ
  if (skillLevel === 'beginner' && avgScore >= 75 && completedExercises.length >= 15) {
    return true;
  }
  if (skillLevel === 'intermediate' && avgScore >= 80 && completedExercises.length >= 25) {
    return true;
  }

  return false;
}

/**
 * วิเคราะห์จุดแข็ง/จุดอ่อน
 * Fixed #6: Use actual category from exercises
 */
export function analyzeStrengthsAndWeaknesses(
  exerciseScores: Record<string, ExerciseScore>,
  allExercises: { id: string; category: string }[]
): { strong: string[]; weak: string[] } {
  const categoryScores: Record<string, number[]> = {};
  
  // Build a map of exerciseId -> category
  const exerciseCategoryMap = new Map(allExercises.map(ex => [ex.id, ex.category]));

  // จัดกลุ่มคะแนนตามหมวดหมู่
  Object.values(exerciseScores).forEach(score => {
    const category = exerciseCategoryMap.get(score.exerciseId);
    if (!category) return;
    
    if (!categoryScores[category]) {
      categoryScores[category] = [];
    }
    categoryScores[category].push(score.averageScore);
  });

  // คำนวณค่าเฉลี่ยแต่ละหมวด
  const categoryAverages = Object.entries(categoryScores).map(([cat, scores]) => ({
    category: cat,
    average: scores.reduce((a, b) => a + b, 0) / scores.length
  }));

  // เรียงลำดับ
  categoryAverages.sort((a, b) => b.average - a.average);

  return {
    strong: categoryAverages.slice(0, 2).map(c => c.category),
    weak: categoryAverages.slice(-2).map(c => c.category)
  };
}

/**
 * คำนวณ streak (วันติดต่อกันที่ฝึก)
 */
export function calculateStreak(lastPracticeDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastPracticeDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // ถ้าเว้นมากกว่า 1 วัน streak หลุด
  if (diffDays > 1) return 0;
  
  return diffDays;
}

/**
 * บันทึกผลการฝึก
 * Fixed #6: Accept exercises data for proper category analysis
 */
export function updateProgress(
  progress: UserProgress,
  exerciseId: string,
  score: number,
  perfectCount: number,
  goodCount: number,
  totalNotes: number,
  allExercises: { id: string; category: string }[] = [],
  exerciseName: string = '',
  maxCombo: number = 0
): UserProgress {
  const now = new Date().toISOString();
  
  // อัพเดทคะแนนบทเรียน
  const existingScore = progress.exerciseScores[exerciseId];
  const newScore: ExerciseScore = existingScore
    ? {
        ...existingScore,
        attempts: existingScore.attempts + 1,
        bestScore: Math.max(existingScore.bestScore, score),
        lastScore: score,
        averageScore: Math.round(
          (existingScore.averageScore * existingScore.attempts + score) /
            (existingScore.attempts + 1)
        ),
        lastAttemptDate: now,
        perfectCount: existingScore.perfectCount + perfectCount,
        goodCount: existingScore.goodCount + goodCount,
        totalNotes: existingScore.totalNotes + totalNotes
      }
    : {
        exerciseId,
        attempts: 1,
        bestScore: score,
        lastScore: score,
        averageScore: score,
        lastAttemptDate: now,
        perfectCount,
        goodCount,
        totalNotes
      };

  // เพิ่มในรายการที่ทำแล้ว
  const completedExercises = progress.completedExercises.includes(exerciseId)
    ? progress.completedExercises
    : [...progress.completedExercises, exerciseId];

  // คำนวณ streak
  const streakDiff = calculateStreak(progress.lastPracticeDate);
  const currentStreak = streakDiff === 0 ? 1 : progress.currentStreak + 1;

  // วิเคราะห์จุดแข็ง/จุดอ่อน
  const updatedScores = { ...progress.exerciseScores, [exerciseId]: newScore };
  
  // Pass allExercises for proper category lookup
  const { strong, weak } = analyzeStrengthsAndWeaknesses(updatedScores, allExercises);

  // สร้างประวัติการฝึกซ้อม
  const newRecord: PracticeSessionRecord = {
    id: Math.random().toString(36).substring(2, 11),
    exerciseId,
    exerciseName: exerciseName || exerciseId,
    score,
    perfectCount,
    goodCount,
    totalNotes,
    date: now
  };

  const history = [newRecord, ...(progress.practiceHistory || [])].slice(0, 20);

  // สร้างก๊อปปี้ของ progress ชั่วคราวเพื่อนำไปเช็คความสำเร็จ
  const tempProgress: UserProgress = {
    ...progress,
    completedExercises,
    exerciseScores: updatedScores,
    currentStreak,
    lastPracticeDate: now,
    weakAreas: weak,
    strongAreas: strong,
    practiceHistory: history,
    unlockedAchievements: progress.unlockedAchievements || []
  };

  // ตรวจสอบและอัปเดตความสำเร็จ
  const unlockedAchievements = checkAchievements(tempProgress, { score, maxCombo });

  return {
    ...tempProgress,
    unlockedAchievements
  };
}

/**
 * สร้าง progress ใหม่สำหรับผู้ใช้ใหม่
 */
export function createNewProgress(
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): UserProgress {
  return {
    skillLevel,
    completedExercises: [],
    exerciseScores: {},
    currentStreak: 0,
    totalPracticeTime: 0,
    lastPracticeDate: new Date().toISOString(),
    weakAreas: [],
    strongAreas: [],
    recommendedExercises: [],
    unlockedAchievements: [],
    practiceHistory: []
  };
}

/**
 * โหลด progress จาก localStorage
 */
export function loadProgress(): UserProgress | null {
  try {
    const saved = localStorage.getItem('userProgress');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * บันทึก progress ลง localStorage
 */
export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem('userProgress', JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}
