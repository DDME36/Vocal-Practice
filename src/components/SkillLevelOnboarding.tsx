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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#fafbfc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 1000
    }}>
      {/* Background decoration matching main app */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(199, 210, 254, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(252, 231, 243, 0.08) 0%, transparent 50%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(167, 139, 250, 0.3)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          ยินดีต้อนรับ
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '40px',
          lineHeight: 1.6,
          fontWeight: 500
        }}>
          เลือกระดับความสามารถของคุณ<br/>
          เพื่อให้เราแนะนำบทฝึกที่เหมาะสมที่สุด
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {levels.map(level => (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              style={{
                background: selected === level.id ? 'white' : 'white',
                border: selected === level.id ? `2px solid ${level.color}` : '2px solid rgba(15, 23, 42, 0.08)',
                borderRadius: '20px',
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                boxShadow: selected === level.id ? `0 4px 16px ${level.bg}` : '0 2px 8px rgba(15, 23, 42, 0.08)'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: selected === level.id ? level.color : '#0f172a',
                marginBottom: '6px'
              }}>
                {level.title}
              </div>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#64748b',
                lineHeight: 1.5,
                fontWeight: 500
              }}>
                {level.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onComplete(selected)}
          disabled={!selected}
          style={{
            width: '100%',
            padding: '16px',
            background: selected ? '#a78bfa' : 'rgba(167, 139, 250, 0.3)',
            color: selected ? 'white' : 'rgba(15, 23, 42, 0.4)',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: selected ? '0 4px 16px rgba(167, 139, 250, 0.3)' : 'none'
          }}
        >
          เริ่มต้นใช้งาน
        </button>

        <p style={{
          marginTop: '20px',
          fontSize: '13px',
          color: '#94a3b8',
          fontWeight: 500
        }}>
          คุณสามารถเปลี่ยนระดับได้ทุกเมื่อในการตั้งค่า
        </p>
      </div>
    </div>
  );
}
