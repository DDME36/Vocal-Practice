/**
 * Latency Calibration System
 * 
 * ปัญหา: Audio latency ทำให้การตรวจจับเสียงไม่ตรงกับจังหวะเพลง
 * - Input latency (mic → processing): 10-50ms
 * - Processing latency (pitch detection): 10-30ms
 * - Output latency (playback): 10-50ms
 * - Visual latency (rendering): ~16ms
 * 
 * วิธีแก้:
 * 1. วัด latency จริงของระบบ (auto-calibration)
 * 2. ชดเชย latency โดยเลื่อนเวลาการตรวจสอบ pitch
 * 3. ให้ผู้ใช้ปรับ manual ได้ถ้าต้องการ
 */

export interface LatencySettings {
  inputLatency: number;      // ms - ความล่าช้าของไมค์
  processingLatency: number; // ms - ความล่าช้าของการประมวลผล
  outputLatency: number;     // ms - ความล่าช้าของเสียงเพลง
  totalCompensation: number; // ms - รวมทั้งหมด
  manualOffset: number;      // ms - ปรับเพิ่มเติมด้วยตัวเอง
}

const DEFAULT_LATENCY: LatencySettings = {
  inputLatency: 30,
  processingLatency: 20,
  outputLatency: 30,
  totalCompensation: 80,
  manualOffset: 0
};

const STORAGE_KEY = 'vocalPractice_latencySettings';

/**
 * โหลดการตั้งค่า latency จาก localStorage
 */
export function loadLatencySettings(): LatencySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_LATENCY, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load latency settings:', e);
  }
  return { ...DEFAULT_LATENCY };
}

/**
 * บันทึกการตั้งค่า latency ลง localStorage
 */
export function saveLatencySettings(settings: LatencySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save latency settings:', e);
  }
}

/**
 * คำนวณ total compensation
 */
export function calculateTotalCompensation(settings: LatencySettings): number {
  return settings.inputLatency + 
         settings.processingLatency + 
         settings.outputLatency + 
         settings.manualOffset;
}

/**
 * อัพเดท total compensation
 */
export function updateTotalCompensation(settings: LatencySettings): LatencySettings {
  return {
    ...settings,
    totalCompensation: calculateTotalCompensation(settings)
  };
}

/**
 * วัด input latency โดยประมาณ (ใช้ AudioContext.baseLatency)
 */
export async function measureInputLatency(audioContext: AudioContext): Promise<number> {
  // AudioContext.baseLatency บอกความล่าช้าของระบบเสียง
  const baseLatency = audioContext.baseLatency || 0;
  const outputLatency = (audioContext as any).outputLatency || 0;
  
  // แปลงเป็น milliseconds
  const latencyMs = (baseLatency + outputLatency) * 1000;
  
  // ถ้าไม่มีข้อมูล ใช้ค่าเริ่มต้นตาม platform
  if (latencyMs === 0) {
    // iOS มักมี latency สูงกว่า
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS ? 50 : 30;
  }
  
  return Math.round(latencyMs);
}

/**
 * Auto-calibrate latency settings
 */
export async function autoCalibrate(audioContext: AudioContext): Promise<LatencySettings> {
  const inputLatency = await measureInputLatency(audioContext);
  
  const settings: LatencySettings = {
    inputLatency,
    processingLatency: 20, // ค่าประมาณสำหรับ pitch detection
    outputLatency: inputLatency, // มักใกล้เคียงกับ input
    totalCompensation: 0,
    manualOffset: 0
  };
  
  return updateTotalCompensation(settings);
}

/**
 * ปรับ manual offset
 */
export function adjustManualOffset(
  settings: LatencySettings, 
  deltaMs: number
): LatencySettings {
  const newSettings = {
    ...settings,
    manualOffset: Math.max(-200, Math.min(200, settings.manualOffset + deltaMs))
  };
  return updateTotalCompensation(newSettings);
}

/**
 * Reset เป็นค่าเริ่มต้น
 */
export function resetToDefault(): LatencySettings {
  return updateTotalCompensation({ ...DEFAULT_LATENCY });
}

/**
 * ชดเชย timestamp ด้วย latency compensation
 * ใช้ในการเช็คว่า pitch ที่ตรวจจับได้ตรงกับ note ที่ควรร้องหรือไม่
 */
export function compensateTimestamp(
  currentTime: number, 
  settings: LatencySettings
): number {
  // เลื่อนเวลาไปข้างหน้าเพื่อชดเชย latency
  return currentTime + (settings.totalCompensation / 1000);
}

/**
 * เช็คว่า pitch ที่ตรวจจับได้ตรงกับ note ที่กำลังเล่นหรือไม่
 * โดยคำนึงถึง latency compensation
 */
export function isPitchMatchingNote(
  detectedFreq: number,
  targetFreq: number,
  tolerance: number = 50 // cents
): boolean {
  if (!detectedFreq || !targetFreq) return false;
  
  // คำนวณความต่างเป็น cents (1 semitone = 100 cents)
  const cents = 1200 * Math.log2(detectedFreq / targetFreq);
  
  return Math.abs(cents) <= tolerance;
}
