import { calculateCategoryMastery } from '../lib/progressionSystem';
import { useProgressStore } from '../stores/useProgressStore';
import { EXERCISES } from '../lib/exercises';
import { ACHIEVEMENTS } from '../lib/achievements';
import {
  BookOpen,
  Award,
  Flame,
  Leaf,
  Sun,
  Waves,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Music,
  Zap,
  Sliders,
  Crown,
  Mic,
  Trophy
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';

function getAchievementIcon(iconName: string, size = 24) {
  switch (iconName) {
    case 'Music': return <Music size={size} />;
    case 'Flame': return <Flame size={size} />;
    case 'Trophy': return <Trophy size={size} />;
    case 'Award': return <Award size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Sparkles': return <Sparkles size={size} />;
    case 'Sliders': return <Sliders size={size} />;
    case 'Crown': return <Crown size={size} />;
    case 'Mic': return <Mic size={size} />;
    default: return <Award size={size} />;
  }
}

export default function ProgressDashboard() {
  const { progress } = useProgressStore();

  if (!progress) {
    return (
      <div className="py-20 px-6 text-center max-w-sm mx-auto flex flex-col items-center select-none">
        <div className="w-16 h-16 rounded-full bg-sand-dark flex items-center justify-center text-taupe mb-6 border border-stone-200/30">
          <BookOpen size={28} />
        </div>
        <h2 className="text-xl font-black text-charcoal mb-2">
          ไม่พบข้อมูลความก้าวหน้า
        </h2>
        <p className="text-sm font-medium text-taupe leading-relaxed">
          เริ่มฝึกซ้อมบทเรียนแรกของคุณในหน้าหลักเพื่อให้ระบบ AI เก็บสถิติความสำเร็จของคุณที่นี่
        </p>
      </div>
    );
  }

  const categories = ['run', 'sc', 'wu', 'arp', 'art', 'br'];
  const categoryNames: Record<string, string> = {
    run: 'ไล่ระดับเสียง (Runs)',
    sc: 'สเกล (Scales)',
    wu: 'วอร์มเสียง (Warm-ups)',
    arp: 'อาร์เพจจิโอ (Arpeggios)',
    art: 'การออกเสียง (Articulation)',
    br: 'การหายใจ (Breathing)'
  };

  const categoryShortNames: Record<string, string> = {
    run: 'Runs',
    sc: 'Scales',
    wu: 'Warm-up',
    arp: 'Arpeggio',
    art: 'Artic',
    br: 'Breathing'
  };

  const exerciseData = EXERCISES.map(ex => ({ id: ex.id, category: ex.category }));
  
  const categoryMastery = categories.map(cat => ({
    category: cat,
    name: categoryShortNames[cat] || cat,
    fullName: categoryNames[cat] || cat,
    score: calculateCategoryMastery(cat, progress.exerciseScores, exerciseData)
  }));

  const totalExercises = progress.completedExercises.length;
  const avgScore = Object.values(progress.exerciseScores).length > 0
    ? Math.round(
        Object.values(progress.exerciseScores).reduce((sum, s) => sum + s.averageScore, 0) /
          Object.values(progress.exerciseScores).length
      )
    : 0;

  // Level config details
  const skillConfig = {
    beginner: { label: 'เริ่มต้น (Beginner)', color: 'text-sage-dark', icon: <Leaf size={20} /> },
    intermediate: { label: 'ปานกลาง (Intermediate)', color: 'text-ochre-dark', icon: <Sun size={20} /> },
    advanced: { label: 'ขั้นสูง (Advanced)', color: 'text-clay-dark', icon: <Waves size={20} /> }
  };
  const curSkill = skillConfig[progress.skillLevel as 'beginner' | 'intermediate' | 'advanced'] || skillConfig.beginner;

  // Historical data for LineChart
  const historyData = [...(progress.practiceHistory || [])]
    .reverse()
    .slice(-10)
    .map((record, index) => ({
      index: index + 1,
      name: record.exerciseName,
      score: record.score
    }));

  const unlockedAchievementsList = progress.unlockedAchievements || [];
  const unlockedCount = unlockedAchievementsList.length;

  return (
    <div className="px-6 py-6 pb-24 space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Bento Grid Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Lessons Card */}
        <div className="bg-gradient-to-br from-clay to-clay-light text-white p-5 rounded-[2rem] shadow-lg shadow-clay/10 relative overflow-hidden flex flex-col justify-between aspect-[1/1.05]">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <BookOpen size={16} />
          </div>
          <div>
            <div className="text-3xl font-black leading-none mb-1">
              {totalExercises}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-85">
              บทฝึกซ้อม
            </div>
          </div>
        </div>

        {/* Avg Score Card */}
        <div className="bg-gradient-to-br from-sage to-sage-light text-white p-5 rounded-[2rem] shadow-lg shadow-sage/10 relative overflow-hidden flex flex-col justify-between aspect-[1/1.05]">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Award size={16} />
          </div>
          <div>
            <div className="text-3xl font-black leading-none mb-1">
              {avgScore}%
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-85">
              ความแม่นยำ
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-ochre to-ochre-light text-white p-5 rounded-[2rem] shadow-lg shadow-ochre/10 relative overflow-hidden flex flex-col justify-between aspect-[1/1.05]">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Flame size={16} />
          </div>
          <div>
            <div className="text-3xl font-black leading-none mb-1">
              {progress.currentStreak}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-85">
              วันต่อเนื่อง
            </div>
          </div>
        </div>
      </div>

      {/* Current Skill Level Card */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-stone-200/50 p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-widest text-taupe mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-clay" /> ระดับความสามารถปัจจุบัน
        </div>
        <div className={`text-xl font-black flex items-center gap-2.5 mb-5 ${curSkill.color}`}>
          <span className="w-8 h-8 rounded-full bg-sand-dark flex items-center justify-center text-current shadow-inner shrink-0">
            {curSkill.icon}
          </span>
          {curSkill.label}
        </div>
        
        {/* Progress block */}
        {progress.skillLevel !== 'advanced' ? (
          <div>
            <div className="w-full h-2 bg-sand-dark rounded-full overflow-hidden mb-3 border border-stone-200/30">
              <div 
                className="h-full bg-clay transition-all duration-500" 
                style={{ width: `${Math.min((totalExercises / 15) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-taupe flex justify-between">
              <span>สำเร็จบทฝึก {totalExercises}/15 ครั้ง</span>
              <span>เหลืออีก {Math.max(0, 15 - totalExercises)} ครั้งเพื่อขยับขั้น</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-bold text-sage-dark bg-sage-light/20 py-2.5 px-4 rounded-2xl flex items-center gap-2">
            <CheckCircleIcon /> คุณบรรลุระดับฝึกฝนขั้นสูงสุดแล้ว!
          </div>
        )}
      </div>

      {/* LineChart for Historical Accuracy Trend */}
      {historyData.length > 0 && (
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-stone-200/50 p-6 shadow-sm">
          <h3 className="text-lg font-black text-charcoal mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-clay" /> แนวโน้มความแม่นยำล่าสุด
          </h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ea" />
                <XAxis dataKey="index" tick={{ fill: '#a09a95', fontSize: 10, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#a09a95', fontSize: 10, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(45, 55, 72, 0.95)', borderRadius: '1rem', border: 'none', color: '#fff' }}
                  labelClassName="text-ochre font-bold text-xs"
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value}%`, 'ความแม่นยำ']}
                  labelFormatter={(label) => {
                    const idx = Number(label) - 1;
                    return historyData[idx]?.name || '';
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#d66853" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#d66853', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 7 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Mastery BarChart & Progress List */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-stone-200/50 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-charcoal mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-ochre" /> ความเชี่ยวชาญตามทักษะ
          </h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryMastery} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ea" />
                <XAxis dataKey="name" tick={{ fill: '#a09a95', fontSize: 10, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#a09a95', fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(45, 55, 72, 0.95)', borderRadius: '1rem', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value}%`, 'ความเชี่ยวชาญ']}
                  labelFormatter={(label) => {
                    const item = categoryMastery.find(d => d.name === label);
                    return item ? item.fullName : label;
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {categoryMastery.map((entry, index) => {
                    const isHigh = entry.score >= 80;
                    const isMid = entry.score >= 60;
                    const color = isHigh ? '#85b09a' : isMid ? '#e8a87c' : '#d66853';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-t border-stone-200/40 pt-5 space-y-4">
          {categoryMastery.map((cat, i) => {
            const isHigh = cat.score >= 80;
            const isMid = cat.score >= 60;
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-charcoal">{cat.fullName}</span>
                  <span className={`font-black ${isHigh ? 'text-sage-dark' : isMid ? 'text-ochre-dark' : 'text-clay-dark'}`}>
                    {cat.score}%
                  </span>
                </div>
                <div className="w-full h-2 bg-sand-dark rounded-full overflow-hidden border border-stone-200/20">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isHigh ? 'bg-sage' : isMid ? 'bg-ochre' : 'bg-clay'
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses (Tactile Grid) */}
      {(progress.strongAreas.length > 0 || progress.weakAreas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {progress.strongAreas.length > 0 && (
            <div className="bg-sage-light/10 border border-sage-light/30 rounded-[2rem] p-6 shadow-sm text-left">
              <h4 className="text-xs font-bold uppercase tracking-widest text-sage-dark mb-4 flex items-center gap-2">
                <Leaf size={14} /> จุดแข็งของคุณ
              </h4>
              <div className="flex flex-wrap gap-2">
                {progress.strongAreas.map((area, i) => (
                  <span key={i} className="px-3.5 py-1.5 bg-white text-sage-dark border border-sage-light/30 rounded-full text-xs font-bold shadow-sm">
                    {categoryNames[area] || area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {progress.weakAreas.length > 0 && (
            <div className="bg-ochre-light/10 border border-ochre/30 rounded-[2rem] p-6 shadow-sm text-left">
              <h4 className="text-xs font-bold uppercase tracking-widest text-ochre-dark mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> จุดที่ควรฝึกฝนเพิ่ม
              </h4>
              <div className="flex flex-wrap gap-2">
                {progress.weakAreas.map((area, i) => (
                  <span key={i} className="px-3.5 py-1.5 bg-white text-ochre-dark border border-ochre/30 rounded-full text-xs font-bold shadow-sm">
                    {categoryNames[area] || area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements Gallery */}
      <div className="bg-white/70 backdrop-blur-md rounded-[2rem] border border-stone-200/50 p-6 shadow-sm">
        <h3 className="text-lg font-black text-charcoal mb-5 flex items-center gap-2">
          <Trophy size={20} className="text-ochre-dark" />
          ความสำเร็จและถ้วยรางวัล ({unlockedCount}/{ACHIEVEMENTS.length})
        </h3>
        
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedAchievementsList.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                className={`flex flex-col items-center p-3 md:p-4 rounded-[2rem] border transition-all duration-300 relative group cursor-pointer ${
                  isUnlocked 
                    ? 'bg-gradient-to-br from-white to-sand-light border-clay/20 shadow-md shadow-clay/5 hover:scale-[1.03]' 
                    : 'bg-stone-50/50 border-stone-200/30 opacity-60 hover:opacity-85'
                }`}
              >
                {/* Icon Container */}
                <div 
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-clay to-ochre text-white shadow-lg shadow-clay/20' 
                      : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {getAchievementIcon(ach.iconName, 20)}
                </div>
                
                {/* Text Details */}
                <div className="text-center w-full">
                  <div className="text-[10px] md:text-xs font-black text-charcoal line-clamp-1 mb-0.5">
                    {ach.name}
                  </div>
                  <div className="text-[8px] md:text-[9px] font-bold text-taupe tracking-wide line-clamp-2 leading-tight">
                    {ach.description}
                  </div>
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-44 md:w-48 p-2.5 bg-charcoal/95 backdrop-blur-md text-white text-[10px] font-medium rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center leading-normal z-30">
                  <div className="font-bold text-ochre mb-1">{ach.name}</div>
                  <div>เงื่อนไข: {ach.requirementText}</div>
                  <div className="mt-1 font-bold text-white/70">
                    {isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
