import { useState } from 'react';

interface Props {
  onComplete: (level: 'beginner' | 'intermediate' | 'advanced') => void;
}

export default function SkillLevelOnboarding({ onComplete }: Props) {
  const [selected, setSelected] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);

  const levels = [
    {
      id: 'beginner' as const,
      title: 'เริ่มต้น',
      description: 'ฉันเพิ่งเริ่มฝึกร้องเพลง หรือยังไม่มีประสบการณ์มากนัก',
      color: '#10b981',
      bg: 'rgba(52, 211, 153, 0.1)',
      border: 'rgba(52, 211, 153, 0.3)'
    },
    {
      id: 'intermediate' as const,
      title: 'ปานกลาง',
      description: 'ฉันร้องเพลงได้พอสมควร และต้องการพัฒนาทักษะให้ดีขึ้น',
      color: '#f59e0b',
      bg: 'rgba(251, 191, 36, 0.1)',
      border: 'rgba(251, 191, 36, 0.3)'
    },
    {
      id: 'advanced' as const,
      title: 'ขั้นสูง',
      description: 'ฉันมีประสบการณ์การร้องเพลงมาก และต้องการท้าทายตัวเอง',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)'
    }
  ];

  return (
    <div className="absolute inset-0 bg-[#fafbfc] flex flex-col items-center justify-center p-6 z-[1000] overflow-y-auto">
      {/* Background decoration matching main app */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(199,210,254,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(252,231,243,0.08)_0%,transparent_50%)] -z-10 pointer-events-none" />

      <div className="max-w-[500px] w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-[0_8px_24px_rgba(167,139,250,0.3)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        
        <h1 className="text-[32px] font-extrabold text-slate-900 mb-2 tracking-tight">
          ยินดีต้อนรับ
        </h1>
        
        <p className="text-base text-slate-600 mb-10 leading-relaxed font-medium">
          เลือกระดับความสามารถของคุณ<br/>
          เพื่อให้เราแนะนำบทฝึกที่เหมาะสมที่สุด
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {levels.map(level => (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              className="bg-white rounded-[20px] p-5 px-6 cursor-pointer transition-all duration-200 text-left shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
              style={{
                border: selected === level.id ? `2px solid ${level.color}` : '2px solid rgba(15, 23, 42, 0.08)',
                boxShadow: selected === level.id ? `0 4px 16px ${level.bg}` : '0 2px 8px rgba(15, 23, 42, 0.08)'
              }}
            >
              <div 
                className="text-lg font-bold mb-1.5"
                style={{ color: selected === level.id ? level.color : '#0f172a' }}
              >
                {level.title}
              </div>
              <p className="m-0 text-sm text-slate-600 leading-normal font-medium">
                {level.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onComplete(selected)}
          disabled={!selected}
          className={`w-full px-4 py-4 border-none rounded-2xl text-base font-bold transition-all duration-300 ${
            selected 
              ? 'bg-purple-400 text-white cursor-pointer shadow-[0_4px_16px_rgba(167,139,250,0.3)]' 
              : 'bg-purple-400/30 text-slate-900/25 cursor-not-allowed shadow-none'
          }`}
        >
          เริ่มต้นใช้งาน
        </button>

        <p className="mt-5 text-[13px] text-slate-400 font-medium">
          คุณสามารถเปลี่ยนระดับได้ทุกเมื่อในการตั้งค่า
        </p>
      </div>
    </div>
  );
}
