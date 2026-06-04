import { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Trophy, Zap, Clock, Music, Play, Plus } from 'lucide-react';
import type { Exercise } from '../lib/exercises';
import { useProgressStore } from '../stores/useProgressStore';
import { useStatsStore } from '../stores/useStatsStore';

interface Props {
  exercises: Exercise[];
  onSelect: (ex: Exercise) => void;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
}

export default function HomeView({ exercises, onSelect }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fixed #1: Use Zustand stores instead of direct localStorage access
  const { progress } = useProgressStore();
  const { stats } = useStatsStore();

  const categories = Array.from(new Set(exercises.map(ex => ex.category || 'อื่นๆ')));
  
  const filteredExercises = selectedCategory
    ? exercises.filter(ex => ex.category === selectedCategory)
    : exercises;

  const recentExercises = progress?.completedExercises
    .slice(-4)
    .map(id => exercises.find(ex => ex.id === id))
    .filter(Boolean) as Exercise[] || [];

  const pathExercise = progress?.recommendedExercises?.length 
    ? exercises.find(ex => ex.id === progress.recommendedExercises[0]) || exercises[0] 
    : exercises[0];

  const currentStep = (progress?.completedExercises?.length || 0) + 1;

  return (
    <div className="min-h-full bg-sand pb-32 pt-12 px-6">
      
      {/* Header */}
      <div className="mb-10 mt-6">
        <h1 className="text-4xl font-black text-charcoal tracking-tight mb-2">
          คลังบทเรียน
        </h1>
        <p className="text-taupe font-medium text-lg">
          ฝึกฝนและบำรุงเสียงของคุณในทุกๆ วัน
        </p>
      </div>

      {/* Organic Stats Row */}
      <div className="flex gap-4 mb-10 overflow-x-auto hide-scrollbar -mx-6 px-6 snap-x">
        <div className="min-w-[140px] snap-start bg-white/60 backdrop-blur-sm p-5 rounded-[2rem] border border-stone-200/60 shadow-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-sage-light/30 flex items-center justify-center text-sage-dark mb-3">
            <Activity size={20} />
          </div>
          <div className="text-3xl font-black text-charcoal leading-none mb-1">{stats.totalExercises}</div>
          <div className="text-[10px] font-bold text-taupe uppercase tracking-widest">ครั้งที่ฝึก</div>
        </div>
        
        <div className="min-w-[140px] snap-start bg-clay p-5 rounded-[2rem] shadow-lg shadow-clay/20 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Trophy size={20} />
          </div>
          <div className="text-3xl font-black leading-none mb-1">{stats.currentStreak}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">วันต่อเนื่อง</div>
        </div>

        <div className="min-w-[140px] snap-start bg-white/60 backdrop-blur-sm p-5 rounded-[2rem] border border-stone-200/60 shadow-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-ochre-light/30 flex items-center justify-center text-ochre-dark mb-3">
            <Zap size={20} />
          </div>
          <div className="text-3xl font-black text-charcoal leading-none mb-1">{stats.maxCombo}</div>
          <div className="text-[10px] font-bold text-taupe uppercase tracking-widest">คอมโบสูงสุด</div>
        </div>
      </div>

      {/* Guided Path / Daily Focus */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-charcoal">เส้นทางของคุณ</h2>
          <span className="text-xs font-bold text-sage-dark bg-sage-light/20 px-3 py-1 rounded-full uppercase tracking-widest">แนะนำสำหรับคุณ</span>
        </div>
        
        <div className="bg-gradient-to-br from-[#e9dfce] to-sand-dark rounded-[2.5rem] p-6 shadow-sm border border-white relative overflow-hidden group cursor-pointer"
             onClick={() => {
               if (pathExercise) onSelect(pathExercise);
             }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-clay-light/20 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700 delay-100" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-clay-dark">
                <Play size={24} className="ml-1 fill-current" />
              </div>
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-sage-light/80 border-2 border-white flex items-center justify-center text-[10px] font-bold text-sage-dark">1</div>
                <div className="w-10 h-10 rounded-full bg-ochre-light/80 border-2 border-white flex items-center justify-center text-[10px] font-bold text-ochre-dark">2</div>
                <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border-2 border-white flex items-center justify-center text-[10px] font-bold text-taupe">+3</div>
              </div>
            </div>
            
            <div className="text-[10px] font-bold text-taupe uppercase tracking-widest mb-2">ขั้นตอนที่ {currentStep}</div>
            
            <h3 className="text-2xl font-black text-charcoal leading-tight mb-2">
              {pathExercise?.name || 'วอร์มเสียงพื้นฐาน'}
            </h3>
            
            <p className="text-charcoal/70 font-medium text-sm line-clamp-2">
              {pathExercise?.goal || 'สร้างรากฐานที่ดีด้วยบทฝึกสำคัญนี้'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent / Continue */}
      {recentExercises.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-charcoal">ฝึกซ้อมต่อ</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {recentExercises.slice(0,2).map(ex => (
              <motion.div
                key={`recent-${ex.id}`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(ex)}
                className="bg-white/80 backdrop-blur-md p-4 rounded-[1.5rem] border border-stone-200/50 flex items-center gap-5 cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-14 h-14 bg-sand-dark rounded-full flex items-center justify-center text-charcoal shrink-0">
                  <Play size={20} className="fill-current ml-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-taupe uppercase tracking-widest mb-1">
                    {ex.category}
                  </div>
                  <h4 className="text-lg font-bold text-charcoal truncate">
                    {ex.name}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Filter (Pills) */}
      <div className="mb-8 -mx-6 px-6">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`snap-start whitespace-nowrap px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${
              !selectedCategory 
                ? 'bg-charcoal text-white' 
                : 'bg-white/60 text-charcoal border border-stone-200/50 hover:bg-white'
            }`}
          >
            หมวดหมู่ทั้งหมด
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`snap-start whitespace-nowrap px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${
                selectedCategory === cat 
                  ? 'bg-charcoal text-white' 
                  : 'bg-white/60 text-charcoal border border-stone-200/50 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Masonry/Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal">
            {selectedCategory ? selectedCategory : 'สำรวจทั้งหมด'}
          </h2>
          <span className="text-sm font-bold text-taupe">
            {filteredExercises.length} รายการ
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExercises.map((ex, i) => (
            <motion.div
              key={ex.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(ex)}
              className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-stone-200/50 cursor-pointer shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group"
            >
              {/* Soft decorative blob */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 transition-transform group-hover:scale-150 blur-2xl ${
                i % 3 === 0 ? 'bg-clay' : i % 3 === 1 ? 'bg-sage' : 'bg-ochre'
              }`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-full bg-sand-dark flex items-center justify-center text-charcoal">
                    <Music size={20} />
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-charcoal shadow-sm border border-stone-100 group-hover:bg-charcoal group-hover:text-white transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
                
                <div className="text-[10px] font-bold text-taupe uppercase tracking-widest mb-2">
                  {ex.category}
                </div>
                
                <h4 className="text-xl font-black text-charcoal leading-tight mb-4">
                  {ex.name}
                </h4>
                
                <div className="flex items-center gap-4 pt-4 border-t border-stone-100 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-taupe">
                    <Clock size={14} /> {Math.ceil(ex.notes.length / 4)}m
                  </div>
                  <div className="w-1 h-1 rounded-full bg-stone-300" />
                  <div className="text-xs font-bold text-taupe capitalize">
                    {ex.difficulty === 'beginner' ? 'เริ่มต้น' : ex.difficulty === 'intermediate' ? 'ปานกลาง' : ex.difficulty === 'advanced' ? 'ขั้นสูง' : 'ปานกลาง'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}