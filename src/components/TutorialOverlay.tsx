import { useState, useEffect } from 'react';

interface Step {
  title: string;
  description: string;
  icon: string;
}

const TUTORIAL_STEPS: Step[] = [
  {
    title: 'ยินดีต้อนรับ!',
    description: 'Vocal Practice จะช่วยคุณฝึกร้องเพลงด้วย AI ตรวจจับระดับเสียงแบบเรียลไทม์',
    icon: '🎤'
  },
  {
    title: 'วัดช่วงเสียง',
    description: 'เริ่มต้นด้วยการวัดช่วงเสียงของคุณ เพื่อให้แอปปรับแบบฝึกให้เหมาะสม',
    icon: '🎵'
  },
  {
    title: 'เลือกแบบฝึก',
    description: 'เลือกแบบฝึกจากหมวดต่างๆ: Runs, Scales, Arpeggios, Breathing และอื่นๆ',
    icon: '🎹'
  },
  {
    title: 'ฝึกและติดตาม',
    description: 'ฝึกร้องตามเสียงนำ แอปจะให้คะแนนความแม่นยำและติดตามความก้าวหน้าของคุณ',
    icon: '📊'
  }
];

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // เช็คว่าเคยดู tutorial แล้วหรือยัง
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => setShow(true), 500);
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
    <div className="fixed inset-0 bg-slate-900/98 z-[10000] flex flex-col items-center justify-center p-5 animate-fadeIn">
      {/* Icon */}
      <div className="text-[80px] mb-[30px] animate-bounce">
        {step.icon}
      </div>

      {/* Content */}
      <div className="max-w-[400px] text-center mb-10">
        <h2 className="text-[28px] font-extrabold text-white mb-4">
          {step.title}
        </h2>
        <p className="text-base text-slate-300 leading-relaxed m-0">
          {step.description}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-[30px]">
        {TUTORIAL_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded transition-all duration-300 ${
              index === currentStep 
                ? 'w-6 bg-purple-400' 
                : 'w-2 bg-purple-400/30'
            }`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full max-w-[400px]">
        <button
          onClick={handleSkip}
          className="flex-1 px-4 py-4 bg-transparent border-2 border-purple-400/30 rounded-xl text-purple-400 text-base font-bold cursor-pointer transition-all duration-200 hover:bg-purple-400/10 hover:border-purple-400"
        >
          ข้าม
        </button>
        <button
          onClick={handleNext}
          className="flex-[2] px-4 py-4 bg-gradient-to-br from-primary to-purple-400 border-none rounded-xl text-white text-base font-bold cursor-pointer shadow-[0_4px_12px_rgba(167,139,250,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(167,139,250,0.5)]"
        >
          {currentStep < TUTORIAL_STEPS.length - 1 ? 'ถัดไป' : 'เริ่มใช้งาน'}
        </button>
      </div>
    </div>
  );
}
