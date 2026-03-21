// Stats Manager - เก็บสถิติการฝึกจริงๆ
export interface UserStats {
  totalExercises: number;
  perfectHits: number;
  maxCombo: number;
  currentStreak: number;
  lastPracticeDate: string | null;
  practiceHistory: PracticeSession[];
}

export interface PracticeSession {
  date: string;
  exerciseId: string;
  score: number;
  perfect: number;
  good: number;
  maxCombo: number;
}

const STATS_KEY = 'vocalPracticeStats';

// โหลดสถิติจาก localStorage
export function loadStats(): UserStats {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  
  return {
    totalExercises: 0,
    perfectHits: 0,
    maxCombo: 0,
    currentStreak: 0,
    lastPracticeDate: null,
    practiceHistory: []
  };
}

// บันทึกสถิติลง localStorage
export function saveStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

// อัพเดทสถิติหลังจากฝึกเสร็จ
export function updateStatsAfterPractice(
  exerciseId: string,
  perfect: number,
  good: number,
  maxCombo: number,
  totalNotes: number
): UserStats {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];
  
  // เพิ่มจำนวนครั้งที่ฝึก
  stats.totalExercises++;
  
  // เพิ่ม perfect hits
  stats.perfectHits += perfect;
  
  // อัพเดท max combo ถ้าทำได้สูงกว่าเดิม
  if (maxCombo > stats.maxCombo) {
    stats.maxCombo = maxCombo;
  }
  
  // คำนวณ streak
  if (stats.lastPracticeDate) {
    const lastDate = new Date(stats.lastPracticeDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // ฝึกวันเดียวกัน - streak ไม่เปลี่ยน
    } else if (diffDays === 1) {
      // ฝึกติดต่อกัน - เพิ่ม streak
      stats.currentStreak++;
    } else {
      // ขาดวัน - รีเซ็ต streak
      stats.currentStreak = 1;
    }
  } else {
    // ครั้งแรก
    stats.currentStreak = 1;
  }
  
  stats.lastPracticeDate = today;
  
  // เพิ่มประวัติการฝึก
  const score = totalNotes > 0 ? Math.round(((perfect + good) / totalNotes) * 100) : 0;
  stats.practiceHistory.push({
    date: today,
    exerciseId,
    score,
    perfect,
    good,
    maxCombo
  });
  
  // เก็บแค่ 100 session ล่าสุด
  if (stats.practiceHistory.length > 100) {
    stats.practiceHistory = stats.practiceHistory.slice(-100);
  }
  
  saveStats(stats);
  return stats;
}

// ดึงข้อมูลการฝึก 7 วันล่าสุด
export function getLast7DaysActivity(): boolean[] {
  const stats = loadStats();
  const today = new Date();
  const last7Days: boolean[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const practiced = stats.practiceHistory.some(session => session.date === dateStr);
    last7Days.push(practiced);
  }
  
  return last7Days;
}
