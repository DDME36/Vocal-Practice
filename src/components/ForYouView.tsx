import { useEffect, useRef, useCallback, useState } from 'react';
import type { Exercise } from '../lib/exercises';
import type { VocalRange } from '../App';
import { midiToNoteName } from '../lib/noteUtils';
import { IconMic, IconMusic, IconFlame } from './Icons';

interface Props {
  exercises: Exercise[];
  vocalRange: VocalRange | null;
  onSelect: (ex: Exercise) => void;
  onRange: () => void;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
}

function MiniRoll({ exercise, size = 120 }: { exercise: Exercise; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  
  // Get category color
  const getCategoryColors = (category: string): [string, string] => {
    const cat = category.toUpperCase();
    switch (cat) {
      case 'WARM-UPS': return ['#fbbf24', '#f59e0b'];
      case 'SCALES': return ['#06b6d4', '#0891b2'];
      case 'RUNS': return ['#a78bfa', '#ec4899'];
      case 'ARPEGGIOS': return ['#34d399', '#10b981'];
      case 'ARTICULATION': return ['#f472b6', '#ec4899'];
      case 'BREATHING': return ['#60a5fa', '#3b82f6'];
      case 'RESONANCE': return ['#c084fc', '#a855f7'];
      case 'DYNAMICS': return ['#fb923c', '#f97316'];
      default: return ['#a78bfa', '#ec4899'];
    }
  };
  
  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = size;
    const H = size * 0.6;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    const notes = exercise.notes.filter(n => !n.isChord);
    if (!notes.length) return;
    
    // แสดงแค่ pattern แรก (ไม่ซ้ำ)
    let firstPatternEnd = 0;
    for (let i = 0; i < notes.length - 1; i++) {
      const currentEnd = notes[i].startBeat + Math.abs(notes[i].durationBeats);
      const nextStart = notes[i + 1].startBeat;
      const gap = nextStart - currentEnd;
      
      if (gap > 0.5) {
        firstPatternEnd = i + 1;
        break;
      }
    }
    
    if (firstPatternEnd === 0) {
      firstPatternEnd = Math.min(8, notes.length);
    }
    
    const displayNotes = notes.slice(0, firstPatternEnd);
    if (!displayNotes.length) return;
    
    // Normalize startBeat to 0 to remove empty space left by skipped reference chords
    const minStartBeat = Math.min(...displayNotes.map(n => n.startBeat));
    const normalizedNotes = displayNotes.map(n => ({
      ...n,
      startBeat: n.startBeat - minStartBeat
    }));

    const midis = normalizedNotes.map(n => n.midi);
    const minM = Math.min(...midis) - 1;
    const maxM = Math.max(...midis) + 1;
    const totalBeats = Math.max(...normalizedNotes.map(n => n.startBeat + Math.abs(n.durationBeats)));
    
    const rowH = H / (maxM - minM + 1);
    const pxPerBeat = W / (totalBeats || 1);
    
    const [color1, color2] = getCategoryColors(exercise.category);
    
    const cat = (exercise.category || '').toUpperCase();
    const isLineStyle = cat === 'RUNS' || cat === 'ARPEGGIOS' || cat === 'RANGE EXPANSION';
    const isBarChart = cat === 'ARTICULATION' || cat === 'BELTING' || cat === 'BREATHING';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = normalizedNotes.map(nt => {
      const x = nt.startBeat * pxPerBeat;
      const y = (maxM - nt.midi) * rowH + rowH * 0.2;
      const w = Math.max(Math.abs(nt.durationBeats) * pxPerBeat - 2, 4);
      const h = rowH * 0.6;
      return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
    });

    if (isLineStyle && points.length > 0) {
      // Connect points with a glowing thick line + dots
      ctx.beginPath();
      ctx.moveTo(points[0].cx, points[0].cy);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].cx, points[i].cy);
      }
      ctx.strokeStyle = color1;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = color2;
        ctx.globalAlpha = 1.0;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    } else if (isBarChart) {
      // Bar chart style (Pillars from bottom)
      points.forEach(p => {
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x, H);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        const barW = Math.max(p.w * 0.6, 8);
        const bx = p.cx - barW / 2;
        if (ctx.roundRect) ctx.roundRect(bx, p.y, barW, H - p.y, barW/2);
        else ctx.rect(bx, p.y, barW, H - p.y);
        ctx.fill();
        
        ctx.fillStyle = color2;
        ctx.beginPath();
        ctx.arc(p.cx, p.y + barW/2, barW/2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Default: rounded rectangles (Scales, Warm-ups)
      points.forEach(p => {
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, p.h / 2);
        else ctx.rect(p.x, p.y, p.w, p.h);
        ctx.fill();
      });
    }
  }, [exercise, size]);
  
  useEffect(() => { draw(); }, [draw]);
  return <canvas ref={ref} style={{ display: 'block' }} />;
}

export default function ForYouView({ exercises, vocalRange, onSelect, onRange, skillLevel }: Props) {
  // Use a shuffled or direct subset for the queue
  const [queue, setQueue] = useState<Exercise[]>(() => {
    return [...exercises].sort(() => Math.random() - 0.5).slice(0, 10);
  });
  const [animatingOut, setAnimatingOut] = useState(false);

  const handleSkip = () => {
    if (animatingOut || queue.length <= 1) return;
    setAnimatingOut(true);
    setTimeout(() => {
      setQueue(prev => prev.slice(1));
      setAnimatingOut(false);
    }, 400); // match css transition duration
  };

  const featured = queue[0];
  const suggestions = queue.slice(1, 4);

  return (
    <div className="home fy">
      <header className="home-header">
        <h1>For You</h1>
        <p className="sub" style={{display:'flex', alignItems:'center', gap: 6}}>
          <IconFlame size={16} style={{color:'var(--accent2)'}}/> แนะนำเฉพาะสำหรับคุณ
        </p>
      </header>

      {!vocalRange && (
        <div className="fy-range-prompt" onClick={onRange}>
          <div className="fy-range-icon"><IconMic size={28}/></div>
          <div>
            <div className="fy-range-title">วัดช่วงเสียงก่อนเริ่มฝึก</div>
            <div className="fy-range-sub">เพื่อปรับบทเรียนให้เหมาะกับเสียงคุณ</div>
          </div>
        </div>
      )}

      {vocalRange && (
        <div className="fy-range-badge" onClick={onRange}>
          <div className="fy-range-icon"><IconMic size={24}/></div>
          <div>
            <div className="fy-range-title">{midiToNoteName(vocalRange.lowMidi)} → {midiToNoteName(vocalRange.highMidi)}</div>
            <div className="fy-range-sub">{vocalRange.voiceType} · กดเพื่อวัดใหม่</div>
          </div>
        </div>
      )}

      {/* Skill Level Badge */}
      {skillLevel && (
        <div style={{
          background: 'white',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: '16px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#64748b',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
          <span>
            แสดงบทฝึกสำหรับระดับ: <span style={{ 
              color: skillLevel === 'beginner' ? '#10b981' : 
                     skillLevel === 'intermediate' ? '#f59e0b' : '#ef4444',
              fontWeight: 700
            }}>
              {skillLevel === 'beginner' && 'เริ่มต้น'}
              {skillLevel === 'intermediate' && 'ปานกลาง'}
              {skillLevel === 'advanced' && 'ขั้นสูง'}
            </span>
          </span>
        </div>
      )}

      {/* Featured Card */}
      {featured && (
        <div className="fy-featured">
          <div className={`fy-main-card ${animatingOut ? 'anim-slide-out' : ''}`} onClick={() => !animatingOut && onSelect(featured)}>
            <div className="fy-cat" style={{display:'flex', alignItems:'center', gap: 6}}>
              <IconMusic size={14}/> {featured.category || 'RUNS'}
            </div>
            <div className="fy-canvas">
              <MiniRoll exercise={featured} size={220} />
            </div>
            <div className="fy-name">{featured.name}</div>
          </div>
        </div>
      )}

      {queue.length > 1 && (
        <button className="fy-skip" onClick={handleSkip} disabled={animatingOut} style={{ opacity: animatingOut ? 0.5 : 1 }}>
          <span style={{ fontSize: 18, marginRight: 8 }}>⏭</span> ข้าม
        </button>
      )}

      <h2 className="sec-title">แนะนำเพิ่มเติม</h2>
      <div className="fy-suggestions">
        {suggestions.map(ex => (
          <div key={ex.id} className="fy-sug-card" onClick={() => onSelect(ex)}>
            <div className="fy-sug-canvas">
              <MiniRoll exercise={ex} size={80} />
            </div>
            <div className="fy-sug-info">
              <div className="fy-sug-cat">{ex.category || 'RUNS'}</div>
              <div className="fy-sug-name">{ex.name}</div>
            </div>
          </div>
        ))}
        {suggestions.length === 0 && <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>ไม่มีบทเรียนเพิ่มเติม</div>}
      </div>
    </div>
  );
}
