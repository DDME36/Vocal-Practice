import { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Mic, Waves, Leaf, ArrowLeft, Sun } from 'lucide-react';
import type { VocalRange } from '../lib/types';
import SettingsView from './SettingsView';
import ProgressDashboard from './ProgressDashboard';
import { useStatsStore } from '../stores/useStatsStore';

interface Props { 
  vocalRange: VocalRange | null;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  onChangeSkillLevel?: () => void;
}

export default function ProfileView({ vocalRange, skillLevel, onChangeSkillLevel }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  
  // Fixed #1: Use Zustand store instead of direct localStorage access
  const { stats, getLast7DaysActivity } = useStatsStore();
  const activityDays = getLast7DaysActivity();

  if (showSettings) {
    return <SettingsView 
      vocalRange={vocalRange} 
      onClose={() => setShowSettings(false)}
      skillLevel={skillLevel}
      onChangeSkillLevel={onChangeSkillLevel}
    />;
  }

  if (showProgress) {
    return (
      <div className="h-full bg-sand">
        <header className="flex justify-between items-center p-6 bg-white/80 backdrop-blur-md border-b border-stone-200/50 sticky top-0 z-50">
          <button 
            className="w-12 h-12 rounded-full bg-sand-dark flex items-center justify-center text-charcoal hover:bg-stone-200 transition-colors"
            onClick={() => setShowProgress(false)}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-charcoal">เส้นทางการพัฒนา</h1>
          <div className="w-12" />
        </header>
        <ProgressDashboard />
      </div>
    );
  }

  const skillLevelConfig = {
    beginner: { label: 'เริ่มต้น', color: 'text-sage-dark', bg: 'bg-sage-light/20', icon: <Leaf size={24} className="text-sage-dark" /> },
    intermediate: { label: 'ปานกลาง', color: 'text-ochre-dark', bg: 'bg-ochre-light/20', icon: <Sun size={24} className="text-ochre-dark" /> },
    advanced: { label: 'ขั้นสูง', color: 'text-clay-dark', bg: 'bg-clay-light/20', icon: <Waves size={24} className="text-clay-dark" /> }
  };

  const currentSkill = skillLevel ? skillLevelConfig[skillLevel] : null;

  return (
    <div className="min-h-full bg-sand pb-32 pt-12 px-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 mt-6">
        <div>
          <h1 className="text-4xl font-black text-charcoal tracking-tight mb-1">โปรไฟล์</h1>
          <p className="text-taupe font-medium text-lg">สถิติและข้อมูลเสียงของคุณ</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(true)}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-charcoal shadow-sm border border-stone-200/50 hover:shadow-md transition-all"
        >
          <Settings size={24} />
        </motion.button>
      </div>

      {/* Main Identity Card */}
      <div className="bg-gradient-to-br from-[#e9dfce] to-sand-dark rounded-[2.5rem] p-8 shadow-sm border border-white mb-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/40 rounded-full blur-2xl" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-white shadow-xl shadow-stone-300/30 flex items-center justify-center text-clay-dark mb-6">
            <Mic size={36} />
          </div>
          
          <h2 className="text-3xl font-black text-charcoal mb-2">นักร้องเสียงทอง</h2>
          <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full text-charcoal font-bold text-sm border border-white">
            <Waves size={16} className="text-clay" />
            {vocalRange?.voiceType || 'ยังไม่ได้ประเมินช่วงเสียง'}
          </div>
        </div>
      </div>

      {/* Organic Skill Level */}
      {currentSkill && (
        <div className={`rounded-[2rem] p-6 mb-10 flex items-center justify-between border border-white/50 shadow-sm ${currentSkill.bg}`}>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
              {currentSkill.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest mb-1">
                ระดับปัจจุบัน
              </div>
              <div className={`text-xl font-black ${currentSkill.color}`}>
                {currentSkill.label}
              </div>
            </div>
          </div>
          {onChangeSkillLevel && (
            <button
              onClick={onChangeSkillLevel}
              className="px-5 py-2.5 bg-white rounded-full text-sm font-bold text-charcoal shadow-sm hover:shadow-md transition-all"
            >
              ประเมินใหม่
            </button>
          )}
        </div>
      )}

      {/* Flow Heatmap */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal">จังหวะการฝึกซ้อม</h2>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 border border-stone-200/50 shadow-sm">
          <div className="flex justify-between gap-3">
            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day, i) => {
              const today = new Date().getDay();
              const dayIndex = (i - today + 6) % 7;
              const isPracticed = activityDays[dayIndex] || false;
              const isToday = i === today;

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className={`text-[10px] font-bold uppercase mb-3 ${isToday ? 'text-charcoal' : 'text-taupe'}`}>
                    {day}
                  </div>
                  <div className={`w-full aspect-[1/2] rounded-full flex items-center justify-center transition-all duration-500 ${
                    isPracticed 
                      ? 'bg-sage text-white shadow-inner'
                      : isToday
                      ? 'bg-sand-dark border-2 border-sage-light text-transparent'
                      : 'bg-sand-dark text-transparent'
                  }`}>
                    {isPracticed && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Soft Stats Grid */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal">สถิติความสำเร็จ</h2>
          <button
            onClick={() => setShowProgress(true)}
            className="text-sm font-bold text-clay hover:text-clay-dark transition-colors"
          >
            ดูรายละเอียด
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'บทเรียนที่จบแล้ว', value: stats.totalExercises, color: 'text-clay', bg: 'bg-clay/10' },
            { label: 'โน้ตที่แม่นยำ', value: stats.perfectHits, color: 'text-sage-dark', bg: 'bg-sage-light/20' },
            { label: 'คอมโบสูงสุด', value: stats.maxCombo, color: 'text-ochre-dark', bg: 'bg-ochre-light/20' }
          ].map((stat, i) => (
            <div
              key={i}
              onClick={() => setShowProgress(true)}
              className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 border border-stone-200/50 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-center"
            >
              <div className={`text-4xl font-black mb-2 ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs font-bold text-taupe uppercase tracking-widest leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
