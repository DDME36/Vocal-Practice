import { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Sun, Waves, Mic, ChevronRight } from 'lucide-react';

interface Props {
  onComplete: (level: 'beginner' | 'intermediate' | 'advanced') => void;
}

export default function SkillLevelOnboarding({ onComplete }: Props) {
  const [selected, setSelected] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);

  const levels = [
    {
      id: 'beginner' as const,
      title: 'ระดับเริ่มต้น (Beginner)',
      description: 'ฉันเป็นมือใหม่หัดร้องเพลง เพิ่งเริ่มเรียนรู้ หรือต้องการปูพื้นฐานการคุมลมและเสียงที่ถูกต้อง',
      colorClass: 'text-sage-dark',
      borderClass: 'border-sage',
      bgClass: 'bg-sage-light/10',
      icon: <Leaf size={24} className="text-sage-dark" />
    },
    {
      id: 'intermediate' as const,
      title: 'ระดับปานกลาง (Intermediate)',
      description: 'ฉันร้องเพลงพอได้แล้ว อยากพัฒนาความแม่นยำของสเกล ความเร็วในการเคลื่อนที่ของเสียง และการใช้ลมอย่างเหมาะสม',
      colorClass: 'text-ochre-dark',
      borderClass: 'border-ochre',
      bgClass: 'bg-ochre-light/10',
      icon: <Sun size={24} className="text-ochre-dark" />
    },
    {
      id: 'advanced' as const,
      title: 'ระดับขั้นสูง (Advanced)',
      description: 'ฉันมีประสบการณ์และต้องการฝึกการขยายช่วงเสียงให้กว้างขึ้น แบบฝึกหัดที่ซับซ้อน และการกระโดดของโน้ตที่รวดเร็ว',
      colorClass: 'text-clay-dark',
      borderClass: 'border-clay',
      bgClass: 'bg-clay-light/10',
      icon: <Waves size={24} className="text-clay-dark" />
    }
  ];

  return (
    <div className="absolute inset-0 bg-sand z-[1000] flex flex-col items-center justify-center p-6 overflow-y-auto select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-clay-light/5 blur-[80px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-sage-light/5 blur-[90px]" />
      </div>

      <div className="w-full max-w-lg flex flex-col relative z-10 pt-8 pb-12">
        {/* Header Icon */}
        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-[#e9dfce] to-sand-dark rounded-[2rem] flex items-center justify-center text-clay-dark shadow-sm border border-white">
          <Mic size={32} />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-charcoal text-center mb-3 tracking-tight">
          เลือกระดับความสามารถของคุณ
        </h1>
        
        {/* Subtitle */}
        <p className="text-base text-taupe text-center mb-10 leading-relaxed max-w-sm mx-auto font-medium">
          ระบบ AI จะนำระดับทักษะนี้ไปคัดสรรความยากและอัตราความเร็ว (BPM) ที่เข้ากับคุณมากที่สุด
        </p>

        {/* Level List */}
        <div className="flex flex-col gap-4 mb-10">
          {levels.map((level) => {
            const isSelected = selected === level.id;
            return (
              <motion.button
                key={level.id}
                onClick={() => setSelected(level.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className={`p-6 rounded-[2rem] border-2 text-left cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? `bg-white ${level.borderClass} shadow-md` 
                    : 'bg-white/60 border-stone-200/50 hover:bg-white hover:border-stone-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4 mb-2.5">
                  <div className="w-10 h-10 rounded-full bg-sand-dark flex items-center justify-center shadow-inner">
                    {level.icon}
                  </div>
                  <div className={`text-lg font-black ${isSelected ? level.colorClass : 'text-charcoal'}`}>
                    {level.title}
                  </div>
                </div>
                <p className="text-sm font-medium text-taupe leading-relaxed pl-14">
                  {level.description}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Start Button */}
        <button
          onClick={() => selected && onComplete(selected)}
          disabled={!selected}
          className={`w-full py-5 rounded-full font-black text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
            selected 
              ? 'bg-charcoal text-white hover:bg-clay hover:shadow-clay/20 cursor-pointer active:scale-[0.98]' 
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          เริ่มต้นฝึกซ้อม <ChevronRight size={20} />
        </button>

        <p className="text-center mt-6 text-xs text-taupe/80 font-semibold tracking-wide">
          * คุณสามารถเลือกสับเปลี่ยนระดับการเรียนรู้ใหม่ได้ทุกเมื่อที่ปุ่มตั้งค่าโปรไฟล์
        </p>
      </div>
    </div>
  );
}
