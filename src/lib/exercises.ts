/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ExerciseNote {
  midi: number;
  startBeat: number;
  durationBeats: number;
  syllable: string;
  isChord?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  icon: string;
  goal: string;
  instructions: string;
  bpm: number;
  startingNote: number;
  notes: ExerciseNote[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  breathingTip?: string;
}

function generatePattern(rootMidi: number, pattern: [number, number][], reps: number, semitoneStep: number, syllable: string, restBeats: number): ExerciseNote[] {
  const notes: ExerciseNote[] = [];
  let beat = 0;
  for (let rep = 0; rep < reps; rep++) {
    const root = rootMidi + (rep * semitoneStep);
    
    // Auto-detect chord type
    const isMinor = pattern.some(([iv]) => iv === 3);
    const chordThird = isMinor ? 3 : 4;
    
    // Reference chord (Root, 3rd, 5th) - plays simultaneously
    [0, chordThird, 7].forEach(interval => {
      notes.push({ 
        midi: root + interval, 
        startBeat: beat, 
        durationBeats: 1.0, 
        syllable: '', 
        isChord: true 
      });
    });
    
    beat += 1.2; // Short pause after chord

    // Melody pattern
    pattern.forEach(([iv, d]) => {
      notes.push({ 
        midi: root + iv, 
        startBeat: beat, 
        durationBeats: d, 
        syllable: syllable.includes('|') ? syllable.split('|')[rep % syllable.split('|').length] : syllable 
      });
      beat += Math.abs(d);
    });
    beat += restBeats;
  }
  return notes;
}

// ---------------- GENERATORS ----------------

// Run Generators - ปรับ BPM ให้เหมาะสมกับแต่ละระดับ
const threeNoteRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[-2,0.5],[-4,0.5],[-2,0.5],[0,1]], 5, 1, syl, 1.5);
const swiftBuildUp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[2,0.5],[4,0.5],[5,0.5],[7,1.5],[4,0.5],[2,0.5],[0,1.5]], 4, 1, syl, 1.5);
const ascendingRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[2,0.5],[4,0.5],[5,0.5],[7,0.5],[9,0.5],[11,0.5],[12,2]], 4, 1, syl, 2);
const descendingRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,0.5],[11,0.5],[9,0.5],[7,0.5],[5,0.5],[4,0.5],[2,0.5],[0,2]], 4, 1, syl, 2);
const octaveRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.25],[2,0.25],[4,0.25],[5,0.25],[7,0.25],[9,0.25],[11,0.25],[12,0.5],[11,0.25],[9,0.25],[7,0.25],[5,0.25],[4,0.25],[2,0.25],[0,1.5]], 3, 1, syl, 1.5);

// Scale Generators - ปรับให้ซ้ำน้อยลง เน้นคุณภาพ
const majScaleAsc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[4,1],[5,1],[7,1],[9,1],[11,1],[12,2]], 4, 1, syl, 2);
const minScaleAsc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[3,1],[5,1],[7,1],[8,1],[10,1],[12,2]], 4, 1, syl, 2);
const majScaleDesc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,1],[11,1],[9,1],[7,1],[5,1],[4,1],[2,1],[0,2]], 4, 1, syl, 2);
const minScaleDesc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,1],[10,1],[8,1],[7,1],[5,1],[3,1],[2,1],[0,2]], 4, 1, syl, 2);
const pentatonicAsc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1.5],[2,1],[4,1],[7,1.5],[9,1],[12,3]], 4, 1, syl, 2);
const pentatonicDesc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,1.5],[9,1],[7,1.5],[4,1],[2,1],[0,3]], 4, 1, syl, 2);
const majScaleInt = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.75],[2,0.25],[0,0.75],[4,0.25],[0,0.75],[5,0.25],[0,0.75],[7,1.5]], 4, 1, syl, 1.5);

// Arpeggio Generators - แต่ละ arpeggio มี pattern ที่โดดเด่น
const majorTriadArp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[4,1],[7,1.5],[4,0.5],[0,2]], 5, 1, syl, 1);
const minorTriadArp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[3,1],[7,1.5],[3,0.5],[0,2]], 5, 1, syl, 1);
const major7Arp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.75],[4,0.75],[7,0.75],[11,0.75],[12,1.5],[11,0.75],[7,0.75],[4,0.75],[0,2]], 5, 1, syl, 2);
const minor7Arp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.75],[3,0.75],[7,0.75],[10,0.75],[12,1.5],[10,0.75],[7,0.75],[3,0.75],[0,2]], 5, 1, syl, 2);

// Warmup Generators - ปรับให้เหมาะกับการอบอุ่นเสียง
const humScale = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[4,1],[5,1],[7,1],[5,1],[4,1],[2,1],[0,2]], 4, 1, syl, 1.5);
const lipTrillSlow = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[4,1],[5,1],[7,1],[5,1],[4,1],[2,1],[0,1.5]], 4, 1, syl, 1.5);
const lipTrillFast = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[2,0.5],[4,0.5],[5,0.5],[7,0.5],[5,0.5],[4,0.5],[2,0.5],[0,1]], 4, 1, syl, 1);
const sirenSlide = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,3],[5,2],[9,2],[12,3]], 3, 1, syl, 2);
const sirenSlideWee = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,2],[7,2],[14,3],[7,2],[0,2]], 2, 1, syl, 2);
const vocalFry = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,4]], 3, 1, syl, 2);

// Articulation Generators - แต่ละตัวมี rhythm ที่แตกต่าง
const staccatoRep = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25]], 5, 1, syl, 1);
const vowelShift = (r: number, _bpm: number, _syl: string) => {
  const notes: ExerciseNote[] = [];
  let beat = 0;
  const root = r;
  ['Mee', 'Meh', 'Mah', 'Moh', 'Moo'].forEach((s) => {
    notes.push({ midi: root, startBeat: beat, durationBeats: 1.5, syllable: s });
    beat += 2;
  });
  return notes;
};

// Breathing Generators - แต่ละตัวมี duration ที่แตกต่าง
const sustainedHold = (r: number, _bpm: number, syl: string, dur: number) => generatePattern(r, [[0,dur]], 3, 1, syl, 4);
const diaphragmBounce = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25]], 4, 1, syl, 1);
const diaphragmPuffs = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[0,0.5],[0,0.5],[0,0.5],[0,0.5],[0,0.5]], 4, 1, syl, 1.5);

// ---------------- THE CATALOG ----------------

export const EXERCISES: Exercise[] = [
  // ===================== RUNS =====================
  { id: 'run-3note-wee', name: 'Three-Note Run (Wee)', category: 'RUNS', icon: '', goal: 'ฝึกความแคล่วคล่องในการไล่โน้ตสั้นๆ', instructions: 'ร้องคำว่า "วี่" (Wee) ไล่โน้ตขึ้นลง', bpm: 100, startingNote: 65, notes: threeNoteRun(65, 100, 'Wee'), difficulty: 'beginner', breathingTip: 'หายใจสั้นๆ ระหว่างรอบ อย่าพยายามร้องยาวเกินไป' },
  { id: 'run-buildup-ah', name: 'Swift Build-Up (Ah)', category: 'RUNS', icon: '', goal: 'ฝึกไต่สเกลขึ้นลงอย่างรวดเร็ว', instructions: 'ร้องสระ "อ้า" (Ah) ไต่สเกลขึ้นลง', bpm: 105, startingNote: 60, notes: swiftBuildUp(60, 105, 'Ah'), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนเริ่ม ใช้กะบังลมพยุงเสียง' },
  { id: 'run-asc-oh', name: 'Ascending Run (Oh)', category: 'RUNS', icon: '', goal: 'พุ่งเสียงขึ้นตามสเกล', instructions: 'ร้องคำว่า "โอ้" (Oh) ไต่คีย์สูงขึ้นไป', bpm: 100, startingNote: 55, notes: ascendingRun(55, 100, 'Oh'), difficulty: 'intermediate', breathingTip: 'เปิดคอกว้าง อย่าบีบเสียงตอนขึ้นสูง' },
  { id: 'run-desc-ooh', name: 'Descending Run (Ooh)', category: 'RUNS', icon: '', goal: 'ลดระดับเสียงอย่างมั่นคง', instructions: 'ร้องคำว่า "อู" (Ooh) ตามสเกลขาลง', bpm: 110, startingNote: 65, notes: descendingRun(65, 110, 'Ooh'), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ แม้เสียงจะลงต่ำ' },
  { id: 'run-octave-fast', name: 'Fast Octave Run', category: 'RUNS', icon: '', goal: 'ตวัดเสียงข้ามอ็อกเทฟด้วยความเร็ว', instructions: 'ร้อง "อ้า" (Ah) รัวๆ ตามคีย์ที่กระโดดไปมา', bpm: 115, startingNote: 55, notes: octaveRun(55, 115, 'Ah'), difficulty: 'advanced', breathingTip: 'ใช้กะบังลมดันเสียงแต่ละโน้ตให้ชัดเจน' },
  { id: 'run-3note-nay', name: 'Three-Note Run (Nay)', category: 'RUNS', icon: '', goal: 'ฝึกความแคล่วคล่องด้วยเสียงแข็ง', instructions: 'ร้องคำว่า "เนย์" (Nay) ขึ้นจมูกเบาๆ ขยับตามโน้ต', bpm: 120, startingNote: 65, notes: threeNoteRun(65, 120, 'Nay'), difficulty: 'advanced', breathingTip: 'หายใจเร็วระหว่างรอบ ใช้กะบังลมดันแต่ละโน้ต' },
  { id: 'run-buildup-gee', name: 'Swift Build-Up (Gee)', category: 'RUNS', icon: '', goal: 'ช่วยดันกล่องเสียงให้กระชับ', instructions: 'ร้องคำว่า "กี้" (Gee) กระแทกตัว G ชัดๆ', bpm: 130, startingNote: 60, notes: swiftBuildUp(60, 130, 'Gee'), difficulty: 'advanced', breathingTip: 'กระแทกกะบังลมทุกโน้ต อย่าปล่อยให้เสียงหลุด' },
  { id: 'run-desc-pent', name: 'Pentatonic Run Descending', category: 'RUNS', icon: '', goal: 'ลูกเล่น R&B เบื้องต้น', instructions: 'ร้อง "โว้ว" (Woah) ไล่สเกล R&B ลงมา', bpm: 110, startingNote: 65, notes: pentatonicDesc(65, 110, 'Woah'), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอตลอดสเกล' },

  // ===================== WARM-UPS =====================
  { id: 'wu-humming', name: 'Humming Scale', category: 'WARM-UPS', icon: '', goal: 'วอร์มเส้นเสียงเบาๆ โดยไม่ใช้สระ', instructions: 'หุบปาก ฮัมเสียง "อืม" (Mmm) ไล่โน้ตขึ้นลง', bpm: 80, startingNote: 60, notes: humScale(60, 80, 'Mmm'), difficulty: 'beginner', breathingTip: 'หายใจเข้าทางจมูก ปล่อยลมออกช้าๆ สม่ำเสมอ' },
  { id: 'wu-liptrill-slow', name: 'Lip Trill (Slow)', category: 'WARM-UPS', icon: '', goal: 'กระตุ้นริมฝีปากและลมกะบังลม', instructions: 'เป่าลมทำริมฝีปากสั่น "บรือ" (Brrr)', bpm: 75, startingNote: 58, notes: lipTrillSlow(58, 75, 'Brrr'), difficulty: 'beginner', breathingTip: 'ใช้ลมจากกะบังลม ไม่ใช่จากคอ ปล่อยให้ริมฝีปากผ่อนคลาย' },
  { id: 'wu-liptrill-fast', name: 'Lip Trill (Medium)', category: 'WARM-UPS', icon: '', goal: 'ความเร็วในการควบคุมลม', instructions: 'ริมฝีปากสั่น "บรือ" (Brrr) รัวๆ', bpm: 90, startingNote: 58, notes: lipTrillFast(58, 90, 'Brrr'), difficulty: 'intermediate', breathingTip: 'จ่ายลมสม่ำเสมอ อย่าให้ขาดตอน' },
  { id: 'wu-siren-ooo', name: 'Siren Slide (Ooo)', category: 'WARM-UPS', icon: '', goal: 'เชื่อม Chest ไป Head Voice', instructions: 'ร้อง "อู" (Ooo) ลากเสียงลื่นไหลแบบสไลด์', bpm: 70, startingNote: 55, notes: sirenSlide(55, 70, 'Ooo'), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนเริ่ม ปล่อยเสียงลื่นไหลไม่ขาดตอน' },
  { id: 'wu-siren-wee', name: 'Siren Slide (Wee)', category: 'WARM-UPS', icon: '', goal: 'ใช้เสียงแหลมในการต่อสะพานเสียง', instructions: 'ร้อง "วี่" (Wee) เน้นดันเสียงขึ้นจมูกนิดๆ', bpm: 75, startingNote: 55, notes: sirenSlideWee(55, 75, 'Wee'), difficulty: 'intermediate', breathingTip: 'อย่าบีบคอ ให้เสียงลอยขึ้นไปตามธรรมชาติ' },
  { id: 'wu-vocalfry', name: 'Vocal Fry Release', category: 'WARM-UPS', icon: '', goal: 'ปลดเกร็งเส้นเสียง', instructions: 'ทำเสียง Vocal Fry (แกร็กๆ ในลำคอ) แคลิ่งยาวๆ', bpm: 60, startingNote: 45, notes: vocalFry(45, 60, 'Uh'), difficulty: 'beginner', breathingTip: 'ผ่อนคลายคอ ใช้ลมน้อยที่สุด' },
  { id: 'wu-humming-minor', name: 'Humming (Minor)', category: 'WARM-UPS', icon: '', goal: 'วอร์มแบบ Minor Feel', instructions: 'ฮัม "อืม" (Mmm) ขยับเสียงกลิ่นอายไมเนอร์', bpm: 85, startingNote: 58, notes: minScaleAsc(58, 85, 'Mmm'), difficulty: 'beginner', breathingTip: 'หายใจเข้าทางจมูก ปล่อยลมออกช้าๆ' },

  // ===================== SCALES =====================
  { id: 'sc-maj-asc-doh', name: 'Major Ascending (Doh)', category: 'SCALES', icon: '', goal: 'จดจำสเกลเมเจอร์ขาขึ้น', instructions: 'ร้องคำว่า "โด" (Doh) ตามสเกลขาขึ้นทีละขั้น', bpm: 80, startingNote: 60, notes: majScaleAsc(60, 80, 'Doh'), difficulty: 'beginner', breathingTip: 'หายใจก่อนขึ้นโน้ตใหม่ อย่าพยายามร้องยาวเกินไป' },
  { id: 'sc-min-asc-lah', name: 'Minor Ascending (Lah)', category: 'SCALES', icon: '', goal: 'จดจำสเกลไมเนอร์ขาขึ้น', instructions: 'ร้องคำว่า "ลา" (Lah) ไต่ขึ้นสเกลไมเนอร์', bpm: 90, startingNote: 57, notes: minScaleAsc(57, 90, 'Lah'), difficulty: 'beginner', breathingTip: 'หายใจก่อนขึ้นโน้ตใหม่ อย่าพยายามร้องยาวเกินไป' },
  { id: 'sc-maj-desc-doh', name: 'Major Descending (Doh)', category: 'SCALES', icon: '', goal: 'จดจำสเกลเมเจอร์ขาลง', instructions: 'ร้องคำว่า "โด" (Doh) ตลอดสเกลขาลง', bpm: 95, startingNote: 72, notes: majScaleDesc(72, 95, 'Doh'), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ แม้เสียงจะลงต่ำ' },
  { id: 'sc-min-desc-lah', name: 'Minor Descending (Lah)', category: 'SCALES', icon: '', goal: 'จดจำสเกลไมเนอร์ขาลง', instructions: 'ร้องคำว่า "ลา" (Lah) ลงบันไดเสียงไมเนอร์', bpm: 95, startingNote: 69, notes: minScaleDesc(69, 95, 'Lah'), difficulty: 'intermediate', breathingTip: 'อย่าปล่อยให้เสียงหลุดตอนลงต่ำ' },
  { id: 'sc-penta-asc', name: 'Pentatonic Ascending', category: 'SCALES', icon: '', goal: 'ฝึกสเกลห้าเสียง R&B / Pop', instructions: 'ร้อง "มา" (Ma) ไต่เสียงแบบ R&B', bpm: 100, startingNote: 60, notes: pentatonicAsc(60, 100, 'Ma'), difficulty: 'intermediate', breathingTip: 'เปิดคอกว้าง ปล่อยเสียงลื่นไหล' },
  { id: 'sc-penta-desc', name: 'Pentatonic Descending', category: 'SCALES', icon: '', goal: 'ฝึกสเกลห้าเสียงขาลง R&B', instructions: 'ร้อง "โน" (No) ตรึงโน้ตขาลง', bpm: 100, startingNote: 72, notes: pentatonicDesc(72, 100, 'No'), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอตลอดสเกล' },
  { id: 'sc-maj-int', name: 'Major Intervals', category: 'SCALES', icon: '', goal: 'กะระยะห่างระหว่างตัวโน้ต', instructions: 'ร้องสระ "อ้า" (Ah) กระโดดข้ามโน้ตกลับไปกลับมา', bpm: 100, startingNote: 60, notes: majScaleInt(60, 100, 'Ah'), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนกระโดดโน้ต' },
  { id: 'sc-maj-asc-fast', name: 'Fast Major Ascending', category: 'SCALES', icon: '', goal: 'ทวนสเกลเมเจอร์แบบเร็ว', instructions: 'ร้อง "พา" (Pah) สั้นๆ รีบขึ้นสเกลใหญ่', bpm: 130, startingNote: 55, notes: majScaleAsc(55, 130, 'Pah'), difficulty: 'advanced', breathingTip: 'ใช้กะบังลมดันแต่ละโน้ตให้ชัดเจน' },
  { id: 'sc-min-asc-fast', name: 'Fast Minor Ascending', category: 'SCALES', icon: '', goal: 'ทวนสเกลไมเนอร์แบบเร็ว', instructions: 'ร้อง "ทา" (Tah) รัวๆ ไปตามสเกลไมเนอร์', bpm: 130, startingNote: 55, notes: minScaleAsc(55, 130, 'Tah'), difficulty: 'advanced', breathingTip: 'กระแทกกะบังลมทุกโน้ต' },

  // ===================== ARPEGGIOS =====================
  { id: 'arp-maj-triad', name: 'Major Triad Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'จับโน้ตคอร์ดเมเจอร์', instructions: 'ร้อง "อ้า" (Ah) ข้ามคีย์กว้างๆ แบบ 1-3-5', bpm: 90, startingNote: 60, notes: majorTriadArp(60, 90, 'Ah'), difficulty: 'beginner', breathingTip: 'หายใจลึกก่อนกระโดดโน้ต เปิดคอกว้าง' },
  { id: 'arp-min-triad', name: 'Minor Triad Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'จับโน้ตคอร์ดไมเนอร์', instructions: 'ร้อง "เอ" (Eh) กระโดด 1-b3-5 สำหรับไมเนอร์', bpm: 90, startingNote: 57, notes: minorTriadArp(57, 90, 'Eh'), difficulty: 'beginner', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ' },
  { id: 'arp-maj7', name: 'Major 7th Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'เพิ่มลูกเล่นโชว์เสียงในคอร์ด 7', instructions: 'ร้อง "โอ้" (Oh) ไต่สูงขึ้นไปแตะโน้ตที่ 7', bpm: 95, startingNote: 55, notes: major7Arp(55, 95, 'Oh'), difficulty: 'intermediate', breathingTip: 'อย่าบีบเสียงตอนขึ้นสูง ปล่อยให้ลอยขึ้นไป' },
  { id: 'arp-min7', name: 'Minor 7th Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'โชว์เสียงคอร์ดไมเนอร์ 7', instructions: 'ร้อง "อู" (Oo) ไต่คอร์ดไมเนอร์แล้วโหนสูง', bpm: 95, startingNote: 55, notes: minor7Arp(55, 95, 'Oo'), difficulty: 'intermediate', breathingTip: 'ใช้กะบังลมพยุงเสียงตลอด' },
  { id: 'arp-maj-triad-gee', name: 'Staccato Triad (Gee)', category: 'ARPEGGIOS', icon: '', goal: 'Major triad แบบขาดๆ', instructions: 'ร้อง "กี้" (Gee) สั้นๆ ขาดๆ เน้นกระบังลม', bpm: 110, startingNote: 60, notes: majorTriadArp(60, 110, 'Gee'), difficulty: 'intermediate', breathingTip: 'กระแทกกะบังลมทุกโน้ต' },
  { id: 'arp-min-triad-nah', name: 'Minor Triad (Nah)', category: 'ARPEGGIOS', icon: '', goal: 'เสียงลงจมูกด้วย Nah', instructions: 'ร้อง "น่า" (Nah) ให้เสียงกังวานในโพรงจมูก', bpm: 100, startingNote: 55, notes: minorTriadArp(55, 100, 'Nah'), difficulty: 'intermediate', breathingTip: 'ปล่อยเสียงขึ้นจมูกเบาๆ' },
  { id: 'arp-maj-wide', name: 'Wide Triad (Aw)', category: 'ARPEGGIOS', icon: '', goal: 'เปิดคอรับเสียงอ้ากว้าง', instructions: 'ร้อง "ออ" (Aw) อ้าขากรรไกรกว้างๆ ทีละคีย์', bpm: 90, startingNote: 55, notes: majorTriadArp(55, 90, 'Aw'), difficulty: 'beginner', breathingTip: 'เปิดคอกว้าง อย่าบีบคอ' },

  // ===================== ARTICULATION (AGILITY) =====================
  { id: 'art-mahmehmee', name: 'Mah Meh Mee Moh Moo', category: 'ARTICULATION', icon: '', goal: 'รักษาตำแหน่งเสียงให้คงที่ขณะเปลี่ยนสระ', instructions: 'เปลี่ยนสระเป็น "มา-เม-มี-โม-มู" ทีละโน้ต', bpm: 80, startingNote: 60, notes: vowelShift(60, 80, ''), difficulty: 'beginner', breathingTip: 'หายใจลึกก่อนเริ่ม รักษาตำแหน่งเสียงให้คงที่' },
  { id: 'art-guggug', name: 'Gug Gug Staccato', category: 'ARTICULATION', icon: '', goal: 'ฝึกเพดานอ่อนให้ขยับเร็ว', instructions: 'ร้อง "กั่ก" (Gug) สั้น กระตุกกระบังลมรัวๆ', bpm: 100, startingNote: 60, notes: staccatoRep(60, 100, 'Gug'), difficulty: 'intermediate', breathingTip: 'กระแทกกะบังลมทุกโน้ต' },
  { id: 'art-mummmum', name: 'Mum Mum Release', category: 'ARTICULATION', icon: '', goal: 'คลายกราม', instructions: 'ร้อง "มัม" (Mum) ปล่อยกรามร่วงผ่อนคลาย', bpm: 110, startingNote: 62, notes: staccatoRep(62, 110, 'Mum'), difficulty: 'intermediate', breathingTip: 'ผ่อนคลายกราม อย่าบีบแน่น' },
  { id: 'art-kuhkuh', name: 'Kuh Kuh Kuh', category: 'ARTICULATION', icon: '', goal: 'ใช้ฐานคอผลักลมอ่อนออกรวดเร็ว', instructions: 'ร้อง "เคอะ" (Kuh) กระแทกลมรัวและเบา', bpm: 120, startingNote: 60, notes: staccatoRep(60, 120, 'Kuh'), difficulty: 'advanced', breathingTip: 'ใช้กะบังลมดันแต่ละโน้ตให้ชัดเจน' },
  { id: 'art-nay-exag', name: 'Exaggerated Nay', category: 'ARTICULATION', icon: '', goal: 'Pharyngeal resonance ดันเสียงขึ้นจมูกจังๆ', instructions: 'ร้อง "เนย์" (Nay) ดัดเป็นเสียงแม่มดจมูกๆ', bpm: 100, startingNote: 62, notes: staccatoRep(62, 100, 'Nay'), difficulty: 'intermediate', breathingTip: 'ปล่อยเสียงขึ้นจมูกเบาๆ' },
  { id: 'art-vowel-fast', name: 'Fast Vowel Shift', category: 'ARTICULATION', icon: '', goal: 'สลับสระกลางอากาศความเร็วสูง', instructions: 'เปลี่ยน "มี-เม-มา-โม-มู" รัวๆ แบบไม่ขาดตอน', bpm: 130, startingNote: 58, notes: vowelShift(58, 130, ''), difficulty: 'advanced', breathingTip: 'หายใจเร็วระหว่างรอบ อย่าให้ขาดตอน' },

  // ===================== BREATHING & ENDURANCE =====================
  { id: 'br-sustained-s', name: 'Sustained S (8 Beats)', category: 'BREATHING', icon: '', goal: 'จ่ายลมสม่ำเสมอ ลดอาการเสียงแกว่ง', instructions: 'ทำเสียงพ่นลม "ซซซซ" (Sssss) แช่ค้างลากยาว', bpm: 60, startingNote: 60, notes: sustainedHold(60, 60, 'Sss', 8), difficulty: 'beginner', breathingTip: 'หายใจลึกจากกะบังลม ปล่อยลมออกช้าๆ สม่ำเสมอ' },
  { id: 'br-sustained-z', name: 'Sustained Z (8 Beats)', category: 'BREATHING', icon: '', goal: 'เชื่อมลมกับการสั่นของเส้นเสียง', instructions: 'ทำเสียง "ซซซ" แบบผึ้ง (Zzz) สั่นที่ฟันยาวๆ', bpm: 60, startingNote: 55, notes: sustainedHold(55, 60, 'Zzz', 8), difficulty: 'beginner', breathingTip: 'ใช้ลมจากกะบังลม ไม่ใช่จากคอ' },
  { id: 'br-staccato-ha', name: 'Diaphragm Bounce (Ha)', category: 'BREATHING', icon: '', goal: 'ออกกำลังกล้ามเนื้อกะบังลมให้เด้งกลับเร็ว', instructions: 'ร้องคำว่า "ฮะ" (Ha) สั้นๆ เด้งกล้ามเนื้อหน้าท้อง', bpm: 110, startingNote: 60, notes: diaphragmBounce(60, 110, 'Ha'), difficulty: 'intermediate', breathingTip: 'กระแทกกะบังลมทุกโน้ต อย่าใช้คอ' },
  { id: 'br-staccato-sh', name: 'Diaphragm Puffs (Shh)', category: 'BREATHING', icon: '', goal: 'ฝึกลมแรงปะทะ', instructions: 'กระตุกท้องพ่นลม "ชู่ว!" (Shh) สั้นๆ ต่อเนื่อง', bpm: 120, startingNote: 60, notes: diaphragmPuffs(60, 120, 'Shh'), difficulty: 'intermediate', breathingTip: 'ใช้กะบังลมดันแต่ละครั้ง' },
  { id: 'br-long-ah-12', name: 'Long Hold Ah (12 Beats)', category: 'BREATHING', icon: '', goal: 'ทนทาน เลี้ยงสระ Ah ให้นิ่งที่สุด', instructions: 'ถอนหายใจเข้าลึก ร้องสระ "อ้า" (Ah) แช่ยาวนิ่งสุดๆ', bpm: 80, startingNote: 62, notes: sustainedHold(62, 80, 'Ah', 12), difficulty: 'intermediate', breathingTip: 'หายใจลึกจากกะบังลม ปล่อยลมออกช้าๆ สม่ำเสมอ' },
  { id: 'br-long-ee-12', name: 'Long Hold Ee (12 Beats)', category: 'BREATHING', icon: '', goal: 'เลี้ยงสระ Ee ไม่ให้บีบคอ', instructions: 'ฉีกยิ้ม และร้องสระ "อี" (Ee) ลากค้างยาวๆ ชิลๆ', bpm: 80, startingNote: 62, notes: sustainedHold(62, 80, 'Ee', 12), difficulty: 'intermediate', breathingTip: 'อย่าบีบคอ ปล่อยให้เสียงลอยออกมา' },

  // ===================== PITCH MATCHING =====================
  { id: 'pt-match-middle', name: 'Find Middle C', category: 'PITCH MATCHNIG', icon: '', goal: 'คลำหาโทนเสียงตรงกลาง', instructions: 'หลังเสียงนำจบ ร้อง "ลา" (La) ตรงโน้ตแล้วแช่ไว้', bpm: 70, startingNote: 60, notes: sustainedHold(60, 70, 'La', 4), difficulty: 'beginner', breathingTip: 'ฟังเสียงอ้างอิงให้ดี แล้วร้องตาม' },
  { id: 'pt-match-high', name: 'Find High C', category: 'PITCH MATCHNIG', icon: '', goal: 'คลำหาโทนเสียงสูง', instructions: 'ดันเสียงร้อง "ลา" (La) แตะขอบบนสุดตามเปียโน', bpm: 70, startingNote: 72, notes: sustainedHold(72, 70, 'La', 4), difficulty: 'intermediate', breathingTip: 'อย่าบีบเสียงตอนขึ้นสูง' },
  { id: 'pt-match-low', name: 'Find Low G', category: 'PITCH MATCHNIG', icon: '', goal: 'คลำหาตัวโน้ตต่ำ', instructions: 'หย่อนอก ร้อง "ลา" (La) ต่ำๆ จนกว่าจะตรงกรอบเป๊ะ', bpm: 70, startingNote: 55, notes: sustainedHold(55, 70, 'La', 4), difficulty: 'beginner', breathingTip: 'ผ่อนคลายคอ อย่าบีบ' },
  { id: 'pt-interval-guess', name: 'Pitch Jump Guess', category: 'PITCH MATCHNIG', icon: '', goal: 'กระโดดเสียงข้ามขั้น', instructions: 'ร้อง "น่า" (Na) กระโดดเมโลดี้ขึ้นไป แล้วลงมารับ', bpm: 80, startingNote: 60, notes: generatePattern(60, [[0,2],[7,2],[0,4]], 4, 1, 'Na', 1), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนกระโดดโน้ต' },

  // ===================== RANGE EXPANSION =====================
  { id: 're-stretch-high', name: 'High Range Stretch', category: 'RANGE EXPANSION', icon: '', goal: 'เพิ่มพีดานเสียงสูงทีละครึ่งเสียง', instructions: 'ใช้เสียงหลบ (Head Voice) ร้อง "วี่" (Wee) แหลมๆ', bpm: 90, startingNote: 67, notes: threeNoteRun(67, 90, 'Wee'), difficulty: 'advanced', breathingTip: 'อย่าบีบคอ ให้เสียงลอยขึ้นไปตามธรรมชาติ' },
  { id: 're-stretch-low', name: 'Low Range Stretch', category: 'RANGE EXPANSION', icon: '', goal: 'ลงโน้ตต่ำทีละครึ่งเสียง', instructions: 'ใช้เสียงแผลง (Chest Voice) ร้อง "โอ้" (Oh) กดต่ำๆ', bpm: 90, startingNote: 50, notes: descendingRun(50, 90, 'Oh'), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ แม้เสียงจะลงต่ำ' },
  { id: 're-mixed-voice', name: 'Mixed Voice Access', category: 'RANGE EXPANSION', icon: '', goal: 'ผสมเสียงช่วงเชื่อมต่อ (Passaggio)', instructions: 'ร้อง "เนย์" (Nay) แบบเสียงขึ้นจมูกไต่อันดับ', bpm: 100, startingNote: 65, notes: swiftBuildUp(65, 100, 'Nay'), difficulty: 'advanced', breathingTip: 'ปล่อยเสียงขึ้นจมูกเบาๆ อย่าบีบคอ' },
  { id: 're-head-voice', name: 'Pure Head Voice', category: 'RANGE EXPANSION', icon: '', goal: 'หลบเสียงให้ใสปิ๊งไร้น้ำหนัก', instructions: 'เสียงนกใสๆ ร้อง "ฮู" (Hoo) ทะลุโน้ตบนสุด', bpm: 85, startingNote: 72, notes: majScaleAsc(72, 85, 'Hoo'), difficulty: 'advanced', breathingTip: 'ให้เสียงลอยขึ้นไปตามธรรมชาติ ไม่ใช้แรง' },
  
  // ===================== BELTING (POWER) =====================
  { id: 'belt-yeah', name: 'Power "Yeah!"', category: 'BELTING', icon: '', goal: 'สร้างพลังเสียงเต็มเสียง', instructions: 'ตะโกนคำว่า "Yeah!" (เย้) แข็งแรง ทรงพลัง', bpm: 100, startingNote: 64, notes: generatePattern(64, [[0,2]], 5, 1, 'Yeah', 2), difficulty: 'advanced', breathingTip: 'ใช้กะบังลมดันเต็มที่ อย่าบีบคอ' },
  { id: 'belt-hey', name: 'Calling "Hey!"', category: 'BELTING', icon: '', goal: 'การเพิ่ม Projection หรือการตะเบ็งอย่างถูกวิธี', instructions: 'ตะโกนเรียกคนไกลๆ ด้วยคำว่า "Hey!" (เฮ้)', bpm: 100, startingNote: 65, notes: generatePattern(65, [[0,1.5]], 5, 1, 'Hey', 2.5), difficulty: 'advanced', breathingTip: 'ดันจากกะบังลม ไม่ใช่จากคอ' }
];
