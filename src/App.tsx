import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, User } from 'lucide-react';

import HomeView from './components/HomeView';
import ProfileView from './components/ProfileView';
import ExerciseDetail from './components/ExerciseDetail';
import PracticeView from './components/PracticeView';
import VocalRangeView from './components/VocalRangeView';
import SkillLevelOnboarding from './components/SkillLevelOnboarding';
import TutorialOverlay from './components/TutorialOverlay';
import LatencyCalibrationTest from './components/LatencyCalibrationTest';
import LevelUpModal from './components/LevelUpModal';

import { useSettingsStore } from './stores/useSettingsStore';
import { useProgressStore } from './stores/useProgressStore';
import { EXERCISES, type Exercise } from './lib/exercises';
import { applyAdaptiveSettings, calculateAdaptiveSettings, adaptExercise } from './lib/adaptiveDifficulty';

// adaptExercise moved to lib/adaptiveDifficulty.ts

// Tab Layout Component
function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', icon: Heart, label: 'หน้าหลัก' },
    { path: '/profile', icon: User, label: 'โปรไฟล์' }
  ];

  // Don't show tab bar on specific routes
  const hiddenRoutes = ['/session', '/range', '/exercise'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-center items-center z-50 h-[calc(80px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="bg-white/90 backdrop-blur-xl border border-stone-200/50 shadow-xl shadow-stone-200/50 rounded-full flex items-center px-6 py-3 gap-8 pointer-events-auto mx-4 mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-clay-dark' : 'text-taupe hover:text-clay'
              }`}
            >
              <motion.div whileTap={{ scale: 0.9 }} animate={isActive ? { y: -2 } : { y: 0 }}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              {isActive && <motion.div layoutId="tab-indicator" className="w-1.5 h-1.5 rounded-full bg-clay mt-0.5 absolute -bottom-3" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Route Wrapper to handle exercise adaptation
function ExerciseDetailWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const exerciseId = location.pathname.split('/').pop();
  
  const { vocalRange } = useSettingsStore();
  const { skillLevel, progress } = useProgressStore();
  
  const baseExercise = EXERCISES.find(e => e.id === exerciseId);

  if (!baseExercise) return <Navigate to="/" />;

  // Adapted logic
  const effectiveRange = vocalRange || { lowMidi: 48, highMidi: 60, voiceType: 'ทั่วไป' };
  let adapted = adaptExercise(baseExercise, effectiveRange);
  
  if (progress && skillLevel) {
    const exerciseScore = progress.exerciseScores[baseExercise.id];
    const recentScores = exerciseScore ? [exerciseScore.lastScore] : [];
    const adaptiveSettings = calculateAdaptiveSettings(baseExercise.id, recentScores, skillLevel);
    adapted = applyAdaptiveSettings(adapted, adaptiveSettings, effectiveRange);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[200] bg-sand overflow-y-auto"
    >
      <ExerciseDetail 
        exercise={adapted} 
        onClose={() => navigate(-1)} 
        onStart={() => navigate(`/session/${adapted.id}`, { state: { adaptedExercise: adapted } })} 
      />
    </motion.div>
  );
}

function PracticeSessionWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  // We pass the already adapted exercise via state so it doesn't change on render
  const adaptedExercise = location.state?.adaptedExercise as Exercise | undefined;

  if (!adaptedExercise) return <Navigate to="/" />;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[300] bg-sand"
    >
      <PracticeView exercise={adaptedExercise} onBack={() => navigate(-1)} />
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Stores
  const { hasSeenTutorial, completeTutorial, hasCalibratedLatency, setLatencySettings, hasCompletedVocalRange, vocalRange, setVocalRange, skipVocalRange } = useSettingsStore();
  const { skillLevel, setSkillLevel, checkLevelUp, performLevelUp } = useProgressStore();

  // Level Up Modal State
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [hasDismissedLevelUp, setHasDismissedLevelUp] = useState(false);
  const lastPathRef = useRef(location.pathname);

  // Scroll restoration
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Track session navigation to reset dismissal state
  useEffect(() => {
    if (lastPathRef.current.startsWith('/session') && location.pathname === '/') {
      setHasDismissedLevelUp(false);
    }
    lastPathRef.current = location.pathname;
  }, [location.pathname]);

  // Level Up Check - Fixed: Use modal instead of window.confirm, restrict path and respect dismissal state
  useEffect(() => {
    if (location.pathname === '/' && checkLevelUp() && skillLevel && skillLevel !== 'advanced' && !hasDismissedLevelUp) {
      setShowLevelUpModal(true);
    }
  }, [location.pathname, checkLevelUp, skillLevel, hasDismissedLevelUp]);

  // Filter exercises
  const filteredExercises = skillLevel 
    ? EXERCISES.filter(ex => {
        if (!ex.difficulty) return true;
        if (skillLevel === 'beginner') return ex.difficulty === 'beginner';
        if (skillLevel === 'intermediate') return ex.difficulty === 'beginner' || ex.difficulty === 'intermediate';
        return true;
      })
    : EXERCISES;

  // Global Onboarding Flow
  if (!hasSeenTutorial) {
    return <TutorialOverlay onComplete={completeTutorial} />;
  }

  if (!skillLevel) {
    return <SkillLevelOnboarding onComplete={setSkillLevel} />;
  }

  if (!hasCalibratedLatency) {
    return (
      <LatencyCalibrationTest 
        isOnboarding={true}
        currentSettings={useSettingsStore.getState().latencySettings}
        onComplete={(newSettings) => setLatencySettings(newSettings)}
        onCancel={() => useSettingsStore.getState().skipLatencyCalibration()}
      />
    );
  }

  if (!vocalRange && !hasCompletedVocalRange) {
    return (
      <VocalRangeView 
        onSave={setVocalRange} 
        onBack={() => {}} 
        isOnboarding={true}
        onSkip={skipVocalRange}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-sand text-charcoal font-sans relative">
      <main className="flex-1 relative w-full h-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname.split('/')[1]}>
            <Route path="/" element={
              <motion.div className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <HomeView exercises={filteredExercises} onSelect={(ex) => navigate(`/exercise/${ex.id}`)} skillLevel={skillLevel} />
              </motion.div>
            } />
            <Route path="/practice" element={
              <motion.div className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <HomeView exercises={filteredExercises} onSelect={(ex) => navigate(`/exercise/${ex.id}`)} skillLevel={skillLevel} />
              </motion.div>
            } />
            <Route path="/profile" element={
              <motion.div className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <ProfileView vocalRange={vocalRange} skillLevel={skillLevel} onChangeSkillLevel={() => setSkillLevel(null)} />
              </motion.div>
            } />
            <Route path="/exercise/:id" element={<ExerciseDetailWrapper />} />
            <Route path="/session/:id" element={<PracticeSessionWrapper />} />
            <Route path="/range" element={
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[100] bg-sand">
                 <VocalRangeView onBack={() => window.history.back()} onSave={setVocalRange} />
              </motion.div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <TabBar />
      
      {/* Level Up Modal - Fixed: Replace window.confirm with proper modal */}
      <AnimatePresence>
        {showLevelUpModal && skillLevel && skillLevel !== 'advanced' && (
          <LevelUpModal
            currentLevel={skillLevel}
            onConfirm={() => {
              performLevelUp();
              setShowLevelUpModal(false);
              setHasDismissedLevelUp(false);
            }}
            onCancel={() => {
              setShowLevelUpModal(false);
              setHasDismissedLevelUp(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
