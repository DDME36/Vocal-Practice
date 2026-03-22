import { useState, useCallback, useEffect } from 'react';
import ForYouView from './components/ForYouView';
import ExercisesView from './components/HomeView';
import TheoryView from './components/TheoryView';
import ProfileView from './components/ProfileView';
import ExerciseDetail from './components/ExerciseDetail';
import PracticeView from './components/PracticeView';
import VocalRangeView from './components/VocalRangeView';
import SkillLevelOnboarding from './components/SkillLevelOnboarding';
import TutorialOverlay from './components/TutorialOverlay';
import { EXERCISES, type Exercise, type ExerciseNote } from './lib/exercises';
import { IconHeart, IconMusic, IconBookOpen, IconUser } from './components/Icons';

type Tab = 'foryou' | 'exercises' | 'theory' | 'profile';
type View = 'tabs' | 'detail' | 'practice' | 'range';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface VocalRange {
  lowMidi: number;
  highMidi: number;
  voiceType: string;
}

// สุ่มคีย์ให้เหมาะกับ range และไม่ซ้ำเดิม
function adaptExercise(ex: Exercise, range: VocalRange): Exercise {
  const exLow = Math.min(...ex.notes.map(n => n.midi));
  const exHigh = Math.max(...ex.notes.map(n => n.midi));
  const exSpan = exHigh - exLow;
  
  // คำนวณช่วงคีย์ที่เหมาะสม
  const minRoot = range.lowMidi + 3;
  let maxRoot = range.highMidi - exSpan - 2;
  
  // ถ้าช่วงเสียงของผู้ใช้แคบกว่าความกว้างของแบบฝึกหัด จะทำให้ maxRoot < minRoot
  // ในกรณีนี้ ให้ยึด minRoot เป็นหลัก เพื่อให้โน้ตต่ำสุดไม่ต่ำจนเกินไป
  if (maxRoot < minRoot) {
    maxRoot = minRoot;
  }
  
  // สุ่มคีย์ในช่วงที่เหมาะสม
  const availableRange = Math.max(1, maxRoot - minRoot);
  const randomOffset = Math.floor(Math.random() * Math.min(availableRange, 7)); // สุ่มไม่เกิน 7 semitones
  const newRoot = Math.max(minRoot, Math.min(minRoot + randomOffset, maxRoot));
  
  const shift = newRoot - exLow;
  
  // สุ่ม BPM เล็กน้อย (±5%)
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

export default function App() {
  const [tab, setTab] = useState<Tab>('foryou');
  const [view, setView] = useState<View>('tabs');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(() => {
    try {
      const saved = localStorage.getItem('skillLevel');
      return saved ? (saved as SkillLevel) : null;
    } catch { return null; }
  });
  const [vocalRange, setVocalRange] = useState<VocalRange | null>(() => {
    try {
      const saved = localStorage.getItem('vocalRange');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Reset scroll position when changing tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const saveSkillLevel = useCallback((level: SkillLevel) => {
    setSkillLevel(level);
    localStorage.setItem('skillLevel', level);
  }, []);

  const saveRange = useCallback((range: VocalRange) => {
    setVocalRange(range);
    localStorage.setItem('vocalRange', JSON.stringify(range));
  }, []);

  // Filter exercises based on skill level
  const filteredExercises = skillLevel 
    ? EXERCISES.filter(ex => {
        if (!ex.difficulty) return true; // Show exercises without difficulty
        if (skillLevel === 'beginner') return ex.difficulty === 'beginner';
        if (skillLevel === 'intermediate') return ex.difficulty === 'beginner' || ex.difficulty === 'intermediate';
        return true; // advanced shows all
      })
    : EXERCISES;

  const openExercise = (ex: Exercise) => {
    // ถ้าผู้ใช้ยังไม่เคยวัดเสียง (vocalRange เป็น null)
    // ให้ใช้ Safe Default Range (C3 ถึง C4) เพื่อความปลอดภัยและร้องสบาย
    const effectiveRange = vocalRange || { lowMidi: 48, highMidi: 60, voiceType: 'General' };
    const adapted = adaptExercise(ex, effectiveRange);
    setSelectedExercise(adapted);
    setView('detail');
  };

  const startPractice = () => setView('practice');
  const goHome = () => { setView('tabs'); setSelectedExercise(null); };

  // Show tutorial first (if not seen before)
  if (showTutorial) {
    return <TutorialOverlay onComplete={() => setShowTutorial(false)} />;
  }

  // Show onboarding if no skill level set
  if (!skillLevel) {
    return <SkillLevelOnboarding onComplete={saveSkillLevel} />;
  }

  if (view === 'detail' && selectedExercise) {
    return (
      <div className="app view-transition">
        <ExerciseDetail exercise={selectedExercise} onClose={goHome} onStart={startPractice} />
      </div>
    );
  }
  if (view === 'practice' && selectedExercise) {
    return (
      <div className="app view-transition">
        <PracticeView exercise={selectedExercise} onBack={() => setView('detail')} />
      </div>
    );
  }
  if (view === 'range') {
    return (
      <div className="app view-transition">
        <VocalRangeView onBack={goHome} onSave={saveRange} />
      </div>
    );
  }

  return (
    <div className="app" style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <div className="tab-content view-transition" key={tab} style={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        {tab === 'foryou' && (
          <ForYouView
            exercises={filteredExercises}
            vocalRange={vocalRange}
            onSelect={openExercise}
            onRange={() => setView('range')}
            skillLevel={skillLevel}
          />
        )}
        {tab === 'exercises' && (
          <ExercisesView
            exercises={filteredExercises}
            vocalRange={vocalRange}
            onSelect={openExercise}
            onRange={() => setView('range')}
            skillLevel={skillLevel}
          />
        )}
        {tab === 'theory' && (
          <TheoryView />
        )}
        {tab === 'profile' && (
          <ProfileView 
            vocalRange={vocalRange} 
            skillLevel={skillLevel}
            onChangeSkillLevel={() => {
              localStorage.removeItem('skillLevel');
              setSkillLevel(null);
            }}
          />
        )}
      </div>

      <nav className="tab-bar">
        <button className={`tab-item ${tab === 'foryou' ? 'active' : ''}`} onClick={() => setTab('foryou')}>
          <span className="tab-icon"><IconHeart size={26} /></span>
        </button>
        <button className={`tab-item ${tab === 'exercises' ? 'active' : ''}`} onClick={() => setTab('exercises')}>
          <span className="tab-icon"><IconMusic size={26} /></span>
        </button>
        <button className={`tab-item ${tab === 'theory' ? 'active' : ''}`} onClick={() => setTab('theory')}>
          <span className="tab-icon"><IconBookOpen size={26} /></span>
        </button>
        <button className={`tab-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          <span className="tab-icon"><IconUser size={26} /></span>
        </button>
      </nav>
    </div>
  );
}
