import { useEffect, useRef, useCallback } from 'react';
import type { Exercise } from '../lib/exercises';
import type { VocalRange } from '../App';
import { midiToNoteName } from '../lib/noteUtils';
import { IconMic } from './Icons';

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
    // หาว่า pattern จบที่ beat ไหน โดยดูจาก rest/gap ที่ยาว
    let firstPatternEnd = 0;
    for (let i = 0; i < notes.length - 1; i++) {
      const currentEnd = notes[i].startBeat + Math.abs(notes[i].durationBeats);
      const nextStart = notes[i + 1].startBeat;
      const gap = nextStart - currentEnd;
      
      // ถ้ามี gap มากกว่า 0.5 beat แสดงว่าจบ pattern แล้ว
      if (gap > 0.5) {
        firstPatternEnd = i + 1;
        break;
      }
    }
    
    // ถ้าไม่เจอ gap ให้แสดงแค่ 8 โน้ตแรก
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

export default function HomeView({ exercises, vocalRange, onSelect, onRange, skillLevel }: Props) {
  // Group by category, handle empty category (for the top section runs)
  const categories = new Map<string, Exercise[]>();
  exercises.forEach(ex => {
    const cat = ex.category || 'RUNS';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(ex);
  });

  return (
    <div className="home">
      <header className="home-header">
        <h1>Exercises</h1>
      </header>

      {/* Adapted Badge */}
      {vocalRange && (
        <div className="adapted-badge" onClick={onRange} style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text)',
          padding: '12px 16px',
          borderRadius: '20px',
          marginBottom: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          border: '1px solid var(--border)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <IconMic size={16}/>
          <span>
            {vocalRange.voiceType} · {midiToNoteName(vocalRange.lowMidi)}-{midiToNoteName(vocalRange.highMidi)}
          </span>
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

      {/* Render top-level uncategorized runs first */}
      {categories.has('RUNS') && (
        <div className="cat-section">
          <div className="ex-grid">
            {categories.get('RUNS')!.map((ex) => (
              <div key={ex.id} className="grid-card" onClick={() => onSelect(ex)}>
                <div className="gc-canvas">
                  <MiniRoll exercise={ex} size={140} />
                </div>
                <div className="gc-name">{ex.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Categorized SCALES, etc. */}
      {Array.from(categories.entries()).map(([cat, list]) => {
        if (cat === 'RUNS') return null;
        
        return (
          <div key={cat} className="cat-section">
            <div className="cat-header">
              <div className="cat-name">{cat}</div>
            </div>
            <div className="ex-grid">
              {list.map((ex) => (
                <div key={ex.id} className="grid-card" onClick={() => onSelect(ex)}>
                  <div className="gc-canvas">
                    <MiniRoll exercise={ex} size={140} />
                  </div>
                  <div className="gc-name">{ex.name}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
