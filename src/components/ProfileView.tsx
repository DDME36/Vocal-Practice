import { useState } from 'react';
import type { VocalRange } from '../App';
import SettingsView from './SettingsView';
import { IconSettings, IconMic, IconCheckCircle, IconFlame, IconMusic } from './Icons';

interface Props { 
  vocalRange: VocalRange | null;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  onChangeSkillLevel?: () => void;
}

export default function ProfileView({ vocalRange, skillLevel, onChangeSkillLevel }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  if (showSettings) {
    return <SettingsView 
      vocalRange={vocalRange} 
      onClose={() => setShowSettings(false)}
      skillLevel={skillLevel}
      onChangeSkillLevel={onChangeSkillLevel}
    />;
  }

  return (
    <div className="home profile-page">
      <header className="home-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Artist Dashboard</h1>
        <button className="gear-btn" onClick={() => setShowSettings(true)}><IconSettings size={28} /></button>
      </header>

      {/* ID Card */}
      <div className="id-card">
        <div className="id-avatar">🎙️</div>
        <div className="id-info">
          <div className="id-name">Guest Singer</div>
          <div className="id-type">{vocalRange?.voiceType || 'Unknown Voice Type'}</div>
        </div>
        <div className="id-actions">›</div>
      </div>

      {/* Skill Level Card */}
      {skillLevel && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '16px',
          marginTop: '16px',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: skillLevel === 'beginner' ? 'rgba(52, 211, 153, 0.15)' : 
                         skillLevel === 'intermediate' ? 'rgba(251, 191, 36, 0.15)' : 
                         'rgba(239, 68, 68, 0.15)',
              border: skillLevel === 'beginner' ? '2px solid rgba(52, 211, 153, 0.3)' : 
                     skillLevel === 'intermediate' ? '2px solid rgba(251, 191, 36, 0.3)' : 
                     '2px solid rgba(239, 68, 68, 0.3)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={
                skillLevel === 'beginner' ? '#10b981' : 
                skillLevel === 'intermediate' ? '#f59e0b' : 
                '#ef4444'
              } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                ระดับความสามารถ
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                {skillLevel === 'beginner' && 'เริ่มต้น'}
                {skillLevel === 'intermediate' && 'ปานกลาง'}
                {skillLevel === 'advanced' && 'ขั้นสูง'}
              </div>
            </div>
          </div>
          {onChangeSkillLevel && (
            <button
              onClick={onChangeSkillLevel}
              style={{
                padding: '8px 16px',
                background: '#a78bfa',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(167, 139, 250, 0.3)'
              }}
            >
              เปลี่ยน
            </button>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <h2 className="sec-title" style={{marginTop: 32}}>Vocal Stats</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="st-val" style={{color: '#6366f1'}}>13</div>
          <div className="st-lbl">Exercises</div>
        </div>
        <div className="stat-box">
          <div className="st-val" style={{color: '#00b894'}}>340</div>
          <div className="st-lbl">Perfect Hits</div>
        </div>
        <div className="stat-box">
          <div className="st-val" style={{color: '#e84118'}}>42</div>
          <div className="st-lbl">Max Combo</div>
        </div>
        <div className="stat-box">
          <div className="st-val" style={{color: '#fbc531'}}>12</div>
          <div className="st-lbl">Days Streak</div>
        </div>
      </div>

      {/* Daily Calendar (Sleeker Timeline) */}
      <h2 className="sec-title" style={{marginTop: 32}}>Activity Timeline</h2>
      <div className="cal-strip">
        {days.map((d, i) => (
          <div key={i} className={`cal-day ${i === today ? 'cal-today' : ''} ${i < today ? 'cal-done' : ''}`}>
             <div className="cd-l">{d}</div>
             <div className="cd-dot"></div>
          </div>
        ))}
      </div>

      {/* Records Badge (Replacing Hexagons) */}
      <h2 className="sec-title" style={{marginTop: 32}}>Milestones Collection</h2>
      <div className="record-grid">
        {[
            {icon: <IconMic size={20}/>, label: 'First Note', active: true},
            {icon: <IconMusic size={20}/>, label: 'Pitch Perfect', active: true},
            {icon: <IconFlame size={20}/>, label: '7-Day Streak', active: false},
            {icon: <IconCheckCircle size={20}/>, label: 'Master Class', active: false},
            {icon: <IconMic size={20}/>, label: 'Vocal God', active: false},
            {icon: <IconFlame size={20}/>, label: '30-Day Streak', active: false},
        ].map((a, i) => (
          <div key={i} className="record-item">
            <div className={`vinyl-disc ${a.active ? 'active' : 'locked'}`}>
               <div className="v-label">
                  <div className="v-icon" style={{pointerEvents: 'none', userSelect: 'none'}}>{a.icon}</div>
               </div>
            </div>
            <div className="r-title">{a.label}</div>
          </div>
        ))}
      </div>
      <div style={{height: 100}}></div>
    </div>
  );
}
