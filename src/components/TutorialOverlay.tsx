import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Music, BookOpen, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TUTORIAL_STEPS: Step[] = [
  {
    title: 'ยินดีต้อนรับ!',
    description: 'แอปฝึกร้องเพลงระดับมืออาชีพที่จะช่วยคุณพัฒนาทักษะด้วยระบบ AI ตรวจจับระดับเสียงเรียลไทม์ที่แม่นยำ',
    icon: <Mic size={36} strokeWidth={2} />
  },
  {
    title: 'วัดช่วงเสียงร้อง',
    description: 'ประเมินและค้นหาประเภทเสียงที่แท้จริงของคุณ เพื่อให้แบบฝึกหัดทั้งหมดปรับแต่งให้เข้ากับเสียงของคุณพอดี',
    icon: <Music size={36} strokeWidth={2} />
  },
  {
    title: 'บทเรียนที่คัดสรรมาแล้ว',
    description: 'เลือกฝึกฝนจากหมวดหมู่ที่เหมาะสม เช่น การคุมระดับเสียง, สเกล, ลมหายใจ และเทคนิคขั้นสูง',
    icon: <BookOpen size={36} strokeWidth={2} />
  },
  {
    title: 'ติดตามความสำเร็จ',
    description: 'ฝึกฝนต่อเนื่องสะสมคอมโบและรับคำแนะนำเชิงวิเคราะห์ส่วนตัวจากระบบ AI Vocal Coach ของเรา',
    icon: <TrendingUp size={36} strokeWidth={2} />
  }
];

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => setShow(true), 300);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className="fixed inset-0 bg-sand z-[10000] flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden select-none">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-clay-light/5 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-sage-light/5 blur-[90px]" />
        <div className="absolute top-[40%] right-[30%] w-[200px] h-[200px] rounded-full bg-ochre-light/5 blur-[70px]" />
      </div>

      {/* Skip Button Top Right */}
      <div className="w-full flex justify-end relative z-10 pt-[env(safe-area-inset-top,0px)]">
        <button
          onClick={handleSkip}
          className="px-5 py-2.5 rounded-full text-taupe font-bold text-sm bg-sand-dark/50 hover:bg-sand-dark border border-stone-200/40 active:scale-95 transition-all cursor-pointer"
        >
          ข้าม
        </button>
      </div>

      {/* Main Content Box */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center relative z-10 my-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.04, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Animated Icon Container */}
            <div className="w-24 h-24 mb-10 bg-gradient-to-br from-[#e9dfce] to-sand-dark rounded-[2.2rem] flex items-center justify-center text-clay shadow-sm border border-white relative">
              <div className="absolute -top-1 -right-1">
                <Sparkles size={18} className="text-ochre" />
              </div>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {step.icon}
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-black text-charcoal mb-4 leading-tight tracking-tight">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-base text-taupe leading-relaxed font-medium px-4">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10 pb-[env(safe-area-inset-bottom,0px)]">
        {/* Step dots */}
        <div className="flex gap-2">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-6 bg-clay' 
                  : 'w-2 bg-stone-200/80 hover:bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full bg-charcoal text-white hover:bg-clay py-5 rounded-full font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-charcoal/10 hover:shadow-clay/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          {currentStep < TUTORIAL_STEPS.length - 1 ? (
            <>
              ถัดไป <ChevronRight size={20} />
            </>
          ) : (
            'เริ่มต้นใช้งาน'
          )}
        </button>
      </div>
    </div>
  );
}
