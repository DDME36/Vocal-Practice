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
    const isMinor = pattern.some(([iv]) => iv === 3);
    const chordThird = isMinor ? 3 : 4;
    [0, chordThird, 7].forEach(interval => {
      notes.push({ midi: root + interval, startBeat: beat, durationBeats: 1.0, syllable: '', isChord: true });
    });
    beat += 1.2;
    pattern.forEach(([iv, d]) => {
      notes.push({ midi: root + iv, startBeat: beat, durationBeats: d, syllable: syllable.includes('|') ? syllable.split('|')[rep % syllable.split('|').length] : syllable });
      beat += Math.abs(d);
    });
    beat += restBeats;
  }
  return notes;
}

// Generators
const threeNoteRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[-2,0.5],[-4,0.5],[-2,0.5],[0,1]], 5, 1, syl, 1.5);
const swiftBuildUp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[2,0.5],[4,0.5],[5,0.5],[7,1.5],[4,0.5],[2,0.5],[0,1.5]], 4, 1, syl, 1.5);
const ascendingRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.5],[2,0.5],[4,0.5],[5,0.5],[7,0.5],[9,0.5],[11,0.5],[12,2]], 4, 1, syl, 2);
const descendingRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,0.5],[11,0.5],[9,0.5],[7,0.5],[5,0.5],[4,0.5],[2,0.5],[0,2]], 4, 1, syl, 2);
const octaveRun = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.25],[2,0.25],[4,0.25],[5,0.25],[7,0.25],[9,0.25],[11,0.25],[12,0.5],[11,0.25],[9,0.25],[7,0.25],[5,0.25],[4,0.25],[2,0.25],[0,1.5]], 3, 1, syl, 1.5);

const majScaleAsc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[4,1],[5,1],[7,1],[9,1],[11,1],[12,2]], 4, 1, syl, 2);
const minScaleAsc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[3,1],[5,1],[7,1],[8,1],[10,1],[12,2]], 4, 1, syl, 2);
const majScaleDesc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,1],[11,1],[9,1],[7,1],[5,1],[4,1],[2,1],[0,2]], 4, 1, syl, 2);
const pentatonicAsc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1.5],[2,1],[4,1],[7,1.5],[9,1],[12,3]], 4, 1, syl, 2);
const pentatonicDesc = (r: number, _bpm: number, syl: string) => generatePattern(r, [[12,1.5],[9,1],[7,1.5],[4,1],[2,1],[0,3]], 4, 1, syl, 2);
const majScaleInt = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.75],[2,0.25],[0,0.75],[4,0.25],[0,0.75],[5,0.25],[0,0.75],[7,1.5]], 4, 1, syl, 1.5);
const majorTriadArp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[4,1],[7,1.5],[4,0.5],[0,2]], 5, 1, syl, 1);
const minorTriadArp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[3,1],[7,1.5],[3,0.5],[0,2]], 5, 1, syl, 1);
const major7Arp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.75],[4,0.75],[7,0.75],[11,0.75],[12,1.5],[11,0.75],[7,0.75],[4,0.75],[0,2]], 5, 1, syl, 2);
const minor7Arp = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.75],[3,0.75],[7,0.75],[10,0.75],[12,1.5],[10,0.75],[7,0.75],[3,0.75],[0,2]], 5, 1, syl, 2);
const humScale = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[4,1],[5,1],[7,1],[5,1],[4,1],[2,1],[0,2]], 4, 1, syl, 1.5);
const lipTrillSlow = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,1],[2,1],[4,1],[5,1],[7,1],[5,1],[4,1],[2,1],[0,1.5]], 4, 1, syl, 1.5);
const sirenSlide = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,3],[5,2],[9,2],[12,3]], 3, 1, syl, 2);
const vocalFry = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,4]], 3, 1, syl, 2);
const staccatoRep = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25]], 5, 1, syl, 1);
const vowelShift = (r: number, _bpm: number, _syl: string) => {
  const notes: ExerciseNote[] = [];
  let beat = 0;
  ['Mee', 'Meh', 'Mah', 'Moh', 'Moo'].forEach((s) => {
    notes.push({ midi: r, startBeat: beat, durationBeats: 1.5, syllable: s });
    beat += 2;
  });
  return notes;
};
const sustainedHold = (r: number, _bpm: number, syl: string, dur: number) => generatePattern(r, [[0,dur]], 3, 1, syl, 4);
const diaphragmBounce = (r: number, _bpm: number, syl: string) => generatePattern(r, [[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25],[0,0.25]], 4, 1, syl, 1);

const randomSyllable = (syllables: string[]) => syllables[Math.floor(Math.random() * syllables.length)];

export const EXERCISES: Exercise[] = [
  // RUNS - รวมแบบที่ซ้ำกัน สุ่มพยางค์
  { id: 'run-3note', name: 'Three-Note Run', category: 'RUNS', icon: '', goal: 'ฝึกความแคล่วคล่องในการไล่โน้ตสั้นๆ', instructions: 'ร้องไล่โน้ตขึ้นลง (สุ่มพยางค์ทุกครั้ง)', bpm: 100, startingNote: 65, notes: threeNoteRun(65, 100, randomSyllable(['Wee', 'Nay', 'Mee', 'Yah'])), difficulty: 'beginner', breathingTip: 'หายใจสั้นๆ ระหว่างรอบ' },
  { id: 'run-buildup', name: 'Swift Build-Up', category: 'RUNS', icon: '', goal: 'ฝึกไต่สเกลขึ้นลงอย่างรวดเร็ว', instructions: 'ร้องไต่สเกลขึ้นลง (สุ่มพยางค์ทุกครั้ง)', bpm: 105, startingNote: 60, notes: swiftBuildUp(60, 105, randomSyllable(['Ah', 'Gee', 'Oh', 'Eh'])), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนเริ่ม ใช้กะบังลมพยุงเสียง' },
  { id: 'run-asc', name: 'Ascending Run', category: 'RUNS', icon: '', goal: 'พุ่งเสียงขึ้นตามสเกล', instructions: 'ร้องไต่คีย์สูงขึ้นไป (สุ่มพยางค์ทุกครั้ง)', bpm: 100, startingNote: 55, notes: ascendingRun(55, 100, randomSyllable(['Oh', 'Ah', 'Ooh', 'Ee'])), difficulty: 'intermediate', breathingTip: 'เปิดคอกว้าง อย่าบีบเสียงตอนขึ้นสูง' },
  { id: 'run-desc', name: 'Descending Run', category: 'RUNS', icon: '', goal: 'ลดระดับเสียงอย่างมั่นคง', instructions: 'ร้องตามสเกลขาลง (สุ่มพยางค์ทุกครั้ง)', bpm: 110, startingNote: 65, notes: descendingRun(65, 110, randomSyllable(['Ooh', 'Oh', 'Ah', 'Aw'])), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ' },
  { id: 'run-octave', name: 'Fast Octave Run', category: 'RUNS', icon: '', goal: 'ตวัดเสียงข้ามอ็อกเทฟด้วยความเร็ว', instructions: 'ร้องรัวๆ ตามคีย์ที่กระโดดไปมา (สุ่มพยางค์ทุกครั้ง)', bpm: 115, startingNote: 55, notes: octaveRun(55, 115, randomSyllable(['Ah', 'Ee', 'Oh', 'Ay'])), difficulty: 'advanced', breathingTip: 'ใช้กะบังลมดันเสียงแต่ละโน้ตให้ชัดเจน' },
  { id: 'run-pent', name: 'Pentatonic Run', category: 'RUNS', icon: '', goal: 'ลูกเล่น R&B เบื้องต้น', instructions: 'ร้องไล่สเกล R&B (สุ่มพยางค์ทุกครั้ง)', bpm: 110, startingNote: 65, notes: pentatonicDesc(65, 110, randomSyllable(['Woah', 'Yeah', 'Oh', 'Ay'])), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอตลอดสเกล' },

  // WARM-UPS
  { id: 'wu-humming', name: 'Humming Scale', category: 'WARM-UPS', icon: '', goal: 'วอร์มเส้นเสียงเบาๆ', instructions: 'หุบปาก ฮัมเสียง "อืม" (Mmm) ไล่โน้ตขึ้นลง', bpm: 80, startingNote: 60, notes: humScale(60, 80, 'Mmm'), difficulty: 'beginner', breathingTip: 'หายใจเข้าทางจมูก ปล่อยลมออกช้าๆ' },
  { id: 'wu-liptrill', name: 'Lip Trill', category: 'WARM-UPS', icon: '', goal: 'กระตุ้นริมฝีปากและลมกะบังลม', instructions: 'เป่าลมทำริมฝีปากสั่น "บรือ" (Brrr)', bpm: 80, startingNote: 58, notes: lipTrillSlow(58, 80, 'Brrr'), difficulty: 'beginner', breathingTip: 'ใช้ลมจากกะบังลม ไม่ใช่จากคอ' },
  { id: 'wu-siren', name: 'Siren Slide', category: 'WARM-UPS', icon: '', goal: 'เชื่อม Chest ไป Head Voice', instructions: 'ร้องลากเสียงลื่นไหลแบบสไลด์ (สุ่มพยางค์ทุกครั้ง)', bpm: 72, startingNote: 55, notes: sirenSlide(55, 72, randomSyllable(['Ooo', 'Wee', 'Ah'])), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนเริ่ม ปล่อยเสียงลื่นไหล' },
  { id: 'wu-vocalfry', name: 'Vocal Fry Release', category: 'WARM-UPS', icon: '', goal: 'ปลดเกร็งเส้นเสียง', instructions: 'ทำเสียง Vocal Fry (แกร็กๆ ในลำคอ)', bpm: 60, startingNote: 45, notes: vocalFry(45, 60, 'Uh'), difficulty: 'beginner', breathingTip: 'ผ่อนคลายคอ ใช้ลมน้อยที่สุด' },

  // SCALES
  { id: 'sc-maj-asc', name: 'Major Scale Ascending', category: 'SCALES', icon: '', goal: 'จดจำสเกลเมเจอร์ขาขึ้น', instructions: 'ร้องตามสเกลขาขึ้นทีละขั้น (สุ่มพยางค์ทุกครั้ง)', bpm: 85, startingNote: 60, notes: majScaleAsc(60, 85, randomSyllable(['Doh', 'La', 'Ma', 'Ah'])), difficulty: 'beginner', breathingTip: 'หายใจก่อนขึ้นโน้ตใหม่' },
  { id: 'sc-min-asc', name: 'Minor Scale Ascending', category: 'SCALES', icon: '', goal: 'จดจำสเกลไมเนอร์ขาขึ้น', instructions: 'ร้องไต่ขึ้นสเกลไมเนอร์ (สุ่มพยางค์ทุกครั้ง)', bpm: 90, startingNote: 57, notes: minScaleAsc(57, 90, randomSyllable(['Lah', 'Mmm', 'Nah', 'Mah'])), difficulty: 'beginner', breathingTip: 'หายใจก่อนขึ้นโน้ตใหม่' },
  { id: 'sc-maj-desc', name: 'Major Scale Descending', category: 'SCALES', icon: '', goal: 'จดจำสเกลเมเจอร์ขาลง', instructions: 'ร้องตลอดสเกลขาลง (สุ่มพยางค์ทุกครั้ง)', bpm: 95, startingNote: 72, notes: majScaleDesc(72, 95, randomSyllable(['Doh', 'Oh', 'Ah', 'Aw'])), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ' },
  { id: 'sc-penta', name: 'Pentatonic Scale', category: 'SCALES', icon: '', goal: 'ฝึกสเกลห้าเสียง R&B / Pop', instructions: 'ร้องไต่เสียงแบบ R&B (สุ่มพยางค์ทุกครั้ง)', bpm: 100, startingNote: 60, notes: pentatonicAsc(60, 100, randomSyllable(['Ma', 'Yeah', 'Woah', 'Oh'])), difficulty: 'intermediate', breathingTip: 'เปิดคอกว้าง ปล่อยเสียงลื่นไหล' },
  { id: 'sc-maj-int', name: 'Major Intervals', category: 'SCALES', icon: '', goal: 'กะระยะห่างระหว่างตัวโน้ต', instructions: 'ร้องกระโดดข้ามโน้ตกลับไปกลับมา (สุ่มพยางค์ทุกครั้ง)', bpm: 100, startingNote: 60, notes: majScaleInt(60, 100, randomSyllable(['Ah', 'Oh', 'Ee', 'Ay'])), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนกระโดดโน้ต' },

  // ARPEGGIOS
  { id: 'arp-maj', name: 'Major Triad Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'จับโน้ตคอร์ดเมเจอร์', instructions: 'ร้องข้ามคีย์กว้างๆ แบบ 1-3-5 (สุ่มพยางค์ทุกครั้ง)', bpm: 90, startingNote: 60, notes: majorTriadArp(60, 90, randomSyllable(['Ah', 'Oh', 'Aw', 'Ay'])), difficulty: 'beginner', breathingTip: 'หายใจลึกก่อนกระโดดโน้ต เปิดคอกว้าง' },
  { id: 'arp-min', name: 'Minor Triad Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'จับโน้ตคอร์ดไมเนอร์', instructions: 'ร้องกระโดด 1-b3-5 สำหรับไมเนอร์ (สุ่มพยางค์ทุกครั้ง)', bpm: 90, startingNote: 57, notes: minorTriadArp(57, 90, randomSyllable(['Eh', 'Nah', 'Mmm', 'Mah'])), difficulty: 'beginner', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ' },
  { id: 'arp-maj7', name: 'Major 7th Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'เพิ่มลูกเล่นโชว์เสียงในคอร์ด 7', instructions: 'ร้องไต่สูงขึ้นไปแตะโน้ตที่ 7 (สุ่มพยางค์ทุกครั้ง)', bpm: 95, startingNote: 55, notes: major7Arp(55, 95, randomSyllable(['Oh', 'Ooh', 'Ah', 'Ee'])), difficulty: 'intermediate', breathingTip: 'อย่าบีบเสียงตอนขึ้นสูง' },
  { id: 'arp-min7', name: 'Minor 7th Arpeggio', category: 'ARPEGGIOS', icon: '', goal: 'โชว์เสียงคอร์ดไมเนอร์ 7', instructions: 'ร้องไต่คอร์ดไมเนอร์แล้วโหนสูง (สุ่มพยางค์ทุกครั้ง)', bpm: 95, startingNote: 55, notes: minor7Arp(55, 95, randomSyllable(['Oo', 'Mmm', 'Nah', 'Mah'])), difficulty: 'intermediate', breathingTip: 'ใช้กะบังลมพยุงเสียงตลอด' },

  // ARTICULATION
  { id: 'art-vowel', name: 'Vowel Shift Exercise', category: 'ARTICULATION', icon: '', goal: 'รักษาตำแหน่งเสียงให้คงที่ขณะเปลี่ยนสระ', instructions: 'เปลี่ยนสระเป็น "มา-เม-มี-โม-มู" ทีละโน้ต', bpm: 80, startingNote: 60, notes: vowelShift(60, 80, ''), difficulty: 'beginner', breathingTip: 'หายใจลึกก่อนเริ่ม รักษาตำแหน่งเสียงให้คงที่' },
  { id: 'art-staccato', name: 'Staccato Exercise', category: 'ARTICULATION', icon: '', goal: 'ฝึกเพดานอ่อนให้ขยับเร็ว', instructions: 'ร้องสั้นๆ กระตุกกระบังลมรัวๆ (สุ่มพยางค์ทุกครั้ง)', bpm: 110, startingNote: 60, notes: staccatoRep(60, 110, randomSyllable(['Gug', 'Kuh', 'Mum', 'Nay'])), difficulty: 'intermediate', breathingTip: 'กระแทกกะบังลมทุกโน้ต' },

  // BREATHING
  { id: 'br-sustained-s', name: 'Sustained S', category: 'BREATHING', icon: '', goal: 'จ่ายลมสม่ำเสมอ', instructions: 'ทำเสียงพ่นลม "ซซซซ" (Sssss) แช่ค้างลากยาว', bpm: 60, startingNote: 60, notes: sustainedHold(60, 60, 'Sss', 8), difficulty: 'beginner', breathingTip: 'หายใจลึกจากกะบังลม ปล่อยลมออกช้าๆ' },
  { id: 'br-sustained-z', name: 'Sustained Z', category: 'BREATHING', icon: '', goal: 'เชื่อมลมกับการสั่นของเส้นเสียง', instructions: 'ทำเสียง "ซซซ" แบบผึ้ง (Zzz) สั่นที่ฟันยาวๆ', bpm: 60, startingNote: 55, notes: sustainedHold(55, 60, 'Zzz', 8), difficulty: 'beginner', breathingTip: 'ใช้ลมจากกะบังลม ไม่ใช่จากคอ' },
  { id: 'br-diaphragm', name: 'Diaphragm Bounce', category: 'BREATHING', icon: '', goal: 'ออกกำลังกล้ามเนื้อกะบังลม', instructions: 'ร้องสั้นๆ เด้งกล้ามเนื้อหน้าท้อง (สุ่มพยางค์ทุกครั้ง)', bpm: 110, startingNote: 60, notes: diaphragmBounce(60, 110, randomSyllable(['Ha', 'Shh', 'Huh'])), difficulty: 'intermediate', breathingTip: 'กระแทกกะบังลมทุกโน้ต อย่าใช้คอ' },
  { id: 'br-long', name: 'Long Hold Exercise', category: 'BREATHING', icon: '', goal: 'ทนทาน เลี้ยงสระให้นิ่งที่สุด', instructions: 'ถอนหายใจเข้าลึก ร้องแช่ยาวนิ่งสุดๆ (สุ่มพยางค์ทุกครั้ง)', bpm: 80, startingNote: 62, notes: sustainedHold(62, 80, randomSyllable(['Ah', 'Ee', 'Oh', 'Oo']), 12), difficulty: 'intermediate', breathingTip: 'หายใจลึกจากกะบังลม ปล่อยลมออกช้าๆ' },

  // PITCH MATCHING
  { id: 'pt-match', name: 'Pitch Matching', category: 'PITCH MATCHING', icon: '', goal: 'คลำหาโทนเสียงให้ตรง', instructions: 'หลังเสียงนำจบ ร้อง "ลา" (La) ตรงโน้ตแล้วแช่ไว้', bpm: 70, startingNote: 60, notes: sustainedHold(60, 70, 'La', 4), difficulty: 'beginner', breathingTip: 'ฟังเสียงอ้างอิงให้ดี แล้วร้องตาม' },
  { id: 'pt-interval', name: 'Pitch Jump Exercise', category: 'PITCH MATCHING', icon: '', goal: 'กระโดดเสียงข้ามขั้น', instructions: 'ร้องกระโดดเมโลดี้ขึ้นไป แล้วลงมารับ (สุ่มพยางค์ทุกครั้ง)', bpm: 80, startingNote: 60, notes: generatePattern(60, [[0,2],[7,2],[0,4]], 4, 1, randomSyllable(['Na', 'La', 'Ma', 'Ah']), 1), difficulty: 'intermediate', breathingTip: 'หายใจลึกก่อนกระโดดโน้ต' },

  // RANGE EXPANSION
  { id: 're-high', name: 'High Range Stretch', category: 'RANGE EXPANSION', icon: '', goal: 'เพิ่มพีดานเสียงสูงทีละครึ่งเสียง', instructions: 'ใช้เสียงหลบ (Head Voice) ร้องแหลมๆ (สุ่มพยางค์ทุกครั้ง)', bpm: 90, startingNote: 67, notes: threeNoteRun(67, 90, randomSyllable(['Wee', 'Hoo', 'Ee', 'Ooh'])), difficulty: 'advanced', breathingTip: 'อย่าบีบคอ ให้เสียงลอยขึ้นไป' },
  { id: 're-low', name: 'Low Range Stretch', category: 'RANGE EXPANSION', icon: '', goal: 'ลงโน้ตต่ำทีละครึ่งเสียง', instructions: 'ใช้เสียงแผลง (Chest Voice) ร้องกดต่ำๆ (สุ่มพยางค์ทุกครั้ง)', bpm: 90, startingNote: 50, notes: descendingRun(50, 90, randomSyllable(['Oh', 'Ah', 'Aw', 'Uh'])), difficulty: 'intermediate', breathingTip: 'รักษาแรงลมให้สม่ำเสมอ' },
  { id: 're-mixed', name: 'Mixed Voice Access', category: 'RANGE EXPANSION', icon: '', goal: 'ผสมเสียงช่วงเชื่อมต่อ (Passaggio)', instructions: 'ร้องแบบเสียงขึ้นจมูกไต่อันดับ (สุ่มพยางค์ทุกครั้ง)', bpm: 100, startingNote: 65, notes: swiftBuildUp(65, 100, randomSyllable(['Nay', 'Nee', 'Nah', 'Nya'])), difficulty: 'advanced', breathingTip: 'ปล่อยเสียงขึ้นจมูกเบาๆ อย่าบีบคอ' },
  
  // BELTING
  { id: 'belt-power', name: 'Power Belting', category: 'BELTING', icon: '', goal: 'สร้างพลังเสียงเต็มเสียง', instructions: 'ตะโกนแข็งแรง ทรงพลัง (สุ่มพยางค์ทุกครั้ง)', bpm: 100, startingNote: 64, notes: generatePattern(64, [[0,2]], 5, 1, randomSyllable(['Yeah', 'Hey', 'Woah', 'Hah']), 2), difficulty: 'advanced', breathingTip: 'ใช้กะบังลมดันเต็มที่ อย่าบีบคอ' }
];
