import { useEffect, useRef, useState, useMemo } from 'react';
import type { Exercise } from '../lib/exercises';
import { midiToFrequency } from '../lib/noteUtils';
import { AudioEngine } from '../lib/audioEngine';

interface Props { exercise: Exercise; onClose: () => void; onStart: () => void; }

export default function ExerciseDetail({ exercise, onClose, onStart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const timersRef = useRef<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const startRef = useRef(0);
  const reqRef = useRef<number>(0);

  // Apply transpose to exercise
  const transposedExercise = useMemo(() => ({
    ...exercise,
    notes: exercise.notes.map(n => ({ ...n, midi: n.midi + transpose }))
  }), [exercise, transpose]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = 280;
    const H = 140;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const minMidi = Math.min(...transposedExercise.notes.map(n => n.midi)) - 2;
    const maxMidi = Math.max(...transposedExercise.notes.map(n => n.midi)) + 2;
    const totalBeats = Math.max(...transposedExercise.notes.map(n => n.startBeat + n.durationBeats));
    const rowH = H / (maxMidi - minMidi + 1);
    const pxPerBeat = W / (totalBeats + 2); // Add padding
    
    // Calculate actual pattern width and center offset
    const patternWidth = totalBeats * pxPerBeat;
    const offsetX = (W - patternWidth) / 2;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let currentBeat = -1;
      if (isPlaying) {
        currentBeat = ((performance.now() - startRef.current) / 60000) * transposedExercise.bpm;
      }

      for (const note of transposedExercise.notes) {
        const x = note.startBeat * pxPerBeat + offsetX;
        const y = (maxMidi - note.midi) * rowH;
        const w = note.durationBeats * pxPerBeat - 2;
        const h = rowH * 0.6;
        const isActive = isPlaying && currentBeat >= note.startBeat && currentBeat <= (note.startBeat + note.durationBeats);

      // ใช้สีเดียวแทน gradient
      ctx.fillStyle = isActive ? '#6366f1' : '#e0e7ff';
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y + rowH * 0.2, Math.max(w, 8), h, h / 2);
        } else {
          ctx.rect(x, y + rowH * 0.2, Math.max(w, 8), h);
        }
        ctx.fill();
      }

      if (isPlaying) {
        reqRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(reqRef.current);
  }, [transposedExercise, isPlaying]);

  const stopPreview = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (engineRef.current) {
      engineRef.current.fadeOutAllTones();
      setTimeout(() => {
        engineRef.current?.stop();
        engineRef.current = null;
      }, 200);
    }
    cancelAnimationFrame(reqRef.current);
    setIsPlaying(false);
  };

  const handlePreview = async () => {
    if (isPlaying) { stopPreview(); return; }
    setIsPlaying(true);

    try {
      // สร้าง AudioContext แบบไม่ต้องขอไมค์ (สำหรับ preview เท่านั้น)
      const engine = new AudioEngine();
      engineRef.current = engine;
      startRef.current = performance.now();

      const msPerBeat = 60000 / transposedExercise.bpm;

      transposedExercise.notes.forEach(note => {
        const tid = window.setTimeout(() => {
          engine.playTone(midiToFrequency(note.midi), note.durationBeats * msPerBeat, note.syllable);
        }, note.startBeat * msPerBeat);
        timersRef.current.push(tid);
      });

      const totalTime = Math.max(...transposedExercise.notes.map(n => (n.startBeat + n.durationBeats) * msPerBeat));
      const endTid = window.setTimeout(() => stopPreview(), totalTime + 300);
      timersRef.current.push(endTid);
    } catch {
      stopPreview();
    }
  };

  const handleStart = () => {
    stopPreview();
    onStart();
  };

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="detail-back" onClick={() => { stopPreview(); onClose(); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="detail-title">{exercise.name}</h1>
        <div style={{width: 24}}></div>
      </div>

      <div className="detail-content">
        {/* Compact Header with Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{exercise.name}</h2>
          {exercise.difficulty && (
            <div style={{
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 700,
              background: exercise.difficulty === 'beginner' ? 'rgba(52, 211, 153, 0.15)' : 
                         exercise.difficulty === 'intermediate' ? 'rgba(251, 191, 36, 0.15)' : 
                         'rgba(239, 68, 68, 0.15)',
              color: exercise.difficulty === 'beginner' ? '#10b981' : 
                     exercise.difficulty === 'intermediate' ? '#f59e0b' : 
                     '#ef4444',
              border: exercise.difficulty === 'beginner' ? '1px solid rgba(52, 211, 153, 0.3)' : 
                      exercise.difficulty === 'intermediate' ? '1px solid rgba(251, 191, 36, 0.3)' : 
                      '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {exercise.difficulty === 'beginner' && 'เริ่มต้น'}
              {exercise.difficulty === 'intermediate' && 'ปานกลาง'}
              {exercise.difficulty === 'advanced' && 'ขั้นสูง'}
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            background: 'rgba(167, 139, 250, 0.1)',
            padding: '10px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa' }}>{exercise.bpm}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>BPM</div>
          </div>
          <div style={{
            background: 'rgba(147, 197, 253, 0.1)',
            padding: '10px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
              {Math.round(exercise.notes.filter(n => !n.isChord).length / 4)}x
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>รอบ</div>
          </div>
          <div style={{
            background: 'rgba(52, 211, 153, 0.1)',
            padding: '10px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
              {Math.round((Math.max(...exercise.notes.map(n => n.startBeat + n.durationBeats)) / exercise.bpm) * 60)}s
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>ระยะเวลา</div>
          </div>
        </div>

        {/* Transpose Controls - Compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>ปรับคีย์:</span>
          <button 
            className="transpose-btn" 
            onClick={() => setTranspose(t => Math.max(t - 1, -12))}
            disabled={transpose <= -12}
            style={{ width: '32px', height: '32px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div style={{
            minWidth: '80px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            color: '#0f172a'
          }}>
            {transpose === 0 ? 'คีย์ปกติ' : `${transpose > 0 ? '+' : ''}${transpose}`}
          </div>
          <button 
            className="transpose-btn" 
            onClick={() => setTranspose(t => Math.min(t + 1, 12))}
            disabled={transpose >= 12}
            style={{ width: '32px', height: '32px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* Preview Card - Compact */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '12px',
          marginBottom: '12px',
          border: '1px solid rgba(15, 23, 42, 0.08)'
        }}>
          <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
          <button 
            onClick={handlePreview}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px',
              background: isPlaying ? '#ef4444' : '#a78bfa',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {isPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                <span>หยุด</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>ฟังตัวอย่าง</span>
              </>
            )}
          </button>
        </div>

        {/* Info Sections - Ultra Compact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(15, 23, 42, 0.08)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              เป้าหมาย
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: '#0f172a' }}>{exercise.goal}</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(15, 23, 42, 0.08)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              วิธีฝึก
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: '#0f172a' }}>{exercise.instructions}</p>
          </div>
          
          {exercise.breathingTip && (
            <div style={{
              background: 'rgba(147, 197, 253, 0.1)',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(147, 197, 253, 0.3)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                เคล็ดลับการหายใจ
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: '#0f172a' }}>{exercise.breathingTip}</p>
            </div>
          )}
        </div>

        {/* Start Button - Sticky at bottom */}
        <button 
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '16px',
            background: '#a78bfa',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          เริ่มฝึก
        </button>
      </div>
    </div>
  );
}
