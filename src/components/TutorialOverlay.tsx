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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.98)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '80px',
        marginBottom: '30px',
        animation: 'bounce 1s ease infinite'
      }}>
        {step.icon}
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '400px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#fff',
          marginBottom: '16px'
        }}>
          {step.title}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#cbd5e1',
          lineHeight: 1.6,
          margin: 0
        }}>
          {step.description}
        </p>
      </div>

      {/* Progress dots */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '30px'
      }}>
        {TUTORIAL_STEPS.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === currentStep ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: index === currentStep ? '#a78bfa' : 'rgba(167, 139, 250, 0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <button
          onClick={handleSkip}
          style={{
            flex: 1,
            padding: '16px',
            background: 'transparent',
            border: '2px solid rgba(167, 139, 250, 0.3)',
            borderRadius: '12px',
            color: '#a78bfa',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
            e.currentTarget.style.borderColor = '#a78bfa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)';
          }}
        >
          ข้าม
        </button>
        <button
          onClick={handleNext}
          style={{
            flex: 2,
            padding: '16px',
            background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(167, 139, 250, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(167, 139, 250, 0.4)';
          }}
        >
          {currentStep < TUTORIAL_STEPS.length - 1 ? 'ถัดไป' : 'เริ่มใช้งาน'}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
