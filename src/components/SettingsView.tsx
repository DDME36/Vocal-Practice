import { useState, useEffect } from 'react';
import type { VocalRange } from '../App';

interface Props { 
  vocalRange: VocalRange | null; 
  onClose: () => void;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  onChangeSkillLevel?: () => void;
}

export default function SettingsView({ vocalRange, onClose, skillLevel, onChangeSkillLevel }: Props) {
  const vt = vocalRange ? vocalRange.voiceType : 'Not Set';
  
  const [dailyGoal, setDailyGoal] = useState(() => localStorage.getItem('setting_dailyGoal') || '10');

  useEffect(() => {
    localStorage.setItem('setting_dailyGoal', dailyGoal);
  }, [dailyGoal]);

  const cycleDailyGoal = () => {
    const goals = ['5', '10', '15', '20', '30'];
    const nextIdx = (goals.indexOf(dailyGoal) + 1) % goals.length;
    setDailyGoal(goals[nextIdx]);
  };

  const handleResetProgress = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมด? (ช่วงเสียง, ระดับความสามารถ, และความคืบหน้าทั้งหมดจะถูกลบ)')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="home settings-page" style={{ paddingBottom: 100, animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <header className="home-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '1px solid var(--border)'}}>
        <h1 style={{margin: 0}}>Settings</h1>
        <button className="cb" onClick={onClose} style={{width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</button>
      </header>
      
      <div style={{height: 24}}></div>

      <div className="set-group">
        <div className="set-item" style={{cursor: 'default'}}>
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <div className="set-icon" style={{background: 'rgba(52, 211, 153, 0.1)', color: '#34d399'}}>🎙️</div>
            <div className="set-label">ช่วงเสียง (Vocal Range)</div>
          </div>
          <div className="set-val">{vt}</div>
        </div>
        {skillLevel && onChangeSkillLevel && (
          <div className="set-item" onClick={onChangeSkillLevel}>
            <div style={{display:'flex', alignItems:'center', gap: 16}}>
              <div className="set-icon" style={{background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </div>
              <div className="set-label">ระดับความสามารถ</div>
            </div>
            <div className="set-val">
              {skillLevel === 'beginner' && 'เริ่มต้น'}
              {skillLevel === 'intermediate' && 'ปานกลาง'}
              {skillLevel === 'advanced' && 'ขั้นสูง'}
              <span className="set-arrow"> ›</span>
            </div>
          </div>
        )}
        <div className="set-item" onClick={cycleDailyGoal}>
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <div className="set-icon" style={{background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24'}}>🔥</div>
            <div className="set-label">เป้าหมายรายวัน</div>
          </div>
          <div className="set-val">{dailyGoal} บทฝึก</div>
        </div>
      </div>

      <div className="set-group">
        <div className="set-item" onClick={handleResetProgress}>
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <div className="set-icon" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <div className="set-label" style={{color: '#ef4444', fontWeight: 600}}>รีเซ็ตข้อมูลทั้งหมด</div>
          </div>
        </div>
      </div>
    </div>
  );
}
