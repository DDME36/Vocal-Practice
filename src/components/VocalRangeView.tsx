import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../lib/audioEngine';
import { frequencyToNote, midiToNoteName, getVoiceType } from '../lib/noteUtils';
import type { VocalRange } from '../App';

interface Props {
  onBack: () => void;
  onSave: (range: VocalRange) => void;
  isOnboarding?: boolean;
  onSkip?: () => void;
}

export default function VocalRangeView({ onBack, onSave, isOnboarding, onSkip }: Props) {
  const engineRef = useRef<AudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeHistoryRef = useRef<number[]>([]);
  
  const [isListening, setIsListening] = useState(false);
  const [curNote, setCurNote] = useState('—');
  const [curFreq, setCurFreq] = useState(0);
  const [lowMidi, setLowMidi] = useState<number | null>(null);
  const [highMidi, setHighMidi] = useState<number | null>(null);
  const [voiceType, setVoiceType] = useState('');
  const [saved, setSaved] = useState(false);
  const [noiseGate, setNoiseGate] = useState(0.015);
  const [centsOff, setCentsOff] = useState(0);
  
  // Use Refs for high-frequency data to prevent extreme React render stuttering
  const currentVolRef = useRef(0);

  const startListening = async () => {
    try {
      const engine = new AudioEngine();
      engine.noiseGate = noiseGate;
      engineRef.current = engine;
      engine.onPitchDetected = (freq, vol) => {
        currentVolRef.current = vol;
        volumeHistoryRef.current.push(vol);
        if (volumeHistoryRef.current.length > 60) volumeHistoryRef.current.shift();
        
        if (!freq || vol < 0.01) return;
        const note = frequencyToNote(freq);
        
        // Bailout state updates if unchanged to save CPU
        setCurNote(prev => prev !== note.fullName ? note.fullName : prev);
        setCurFreq(prev => prev !== Math.round(freq) ? Math.round(freq) : prev);
        setCentsOff(note.centsOff);
        
        setLowMidi(prev => (prev === null ? note.midiNumber : Math.min(prev, note.midiNumber)));
        setHighMidi(prev => (prev === null ? note.midiNumber : Math.max(prev, note.midiNumber)));
      };
      await engine.start();
      setIsListening(true);
      setSaved(false);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้\nกรุณาตรวจสอบ:\n1. อนุญาตให้เข้าถึงไมโครโฟนใน Settings\n2. ปิดแอปอื่นที่ใช้ไมโครโฟนอยู่\n3. ลองรีเฟรชหน้าเว็บ');
    }
  };

  const stopListening = () => {
    engineRef.current?.stop();
    setIsListening(false);
    if (lowMidi !== null && highMidi !== null) {
      const vt = getVoiceType(lowMidi, highMidi);
      setVoiceType(vt);
    }
  };

  const handleSave = () => {
    if (lowMidi !== null && highMidi !== null && voiceType) {
      onSave({ lowMidi, highMidi, voiceType });
      setSaved(true);
    }
  };

  const reset = () => {
    setLowMidi(null);
    setHighMidi(null);
    setVoiceType('');
    setCurNote('—');
    setCurFreq(0);
    setCentsOff(0);
    setSaved(false);
    volumeHistoryRef.current = [];
  };

  const handleNoiseGate = (val: number) => {
    setNoiseGate(val);
    if (engineRef.current) engineRef.current.noiseGate = val;
  };

  useEffect(() => () => engineRef.current?.stop(), []);

  // Implement Wake Lock to prevent screen sleep while testing vocal range
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };

    if (isListening) {
      requestWakeLock();
    }

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible' && isListening) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) { wakeLock.release().catch(() => {}); }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  // Canvas visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isListening) return;
    
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 200 * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = '200px';
    canvas.style.height = '200px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, 200, 200);
      
      const centerX = 100;
      const centerY = 100;
      const baseRadius = 60;
      
      // Draw waveform bars
      const bars = 32;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const volIndex = Math.floor((i / bars) * volumeHistoryRef.current.length);
        const vol = volumeHistoryRef.current[volIndex] || 0;
        const barHeight = Math.min(vol * 800, 40);
        
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
        
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'rgba(108, 92, 231, 0.3)');
        gradient.addColorStop(1, 'rgba(108, 92, 231, 0.8)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      
      // Draw center circle
      const currentVol = currentVolRef.current;
      const pulseScale = 1 + (currentVol * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.7 * pulseScale, 0, Math.PI * 2);
      const circleGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.7);
      circleGrad.addColorStop(0, 'rgba(108, 92, 231, 0.2)');
      circleGrad.addColorStop(1, 'rgba(108, 92, 231, 0.05)');
      ctx.fillStyle = circleGrad;
      ctx.fill();
      
      raf = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(raf);
  }, [isListening]); // REMOVED volume DEPENDENCY to stop canvas loop recreation stutter!

  // We can render cents bar dynamically using a fast ref approach or just trigger it sparingly.
  // Using inline style for cents bar since it's lightweight DOM update or rely on React state if needed.
  // Actually, we can just let it stay a ref and only the dot moves smoothly, wait, the dot needs state to move.
  // For extreme smoothness, we update the dot style directly via ref!

  return (
    <div className="vr" style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="vr-head">
        {!isOnboarding ? (
          <button className="cb" onClick={() => { engineRef.current?.stop(); onBack(); }}>←</button>
        ) : (
          <button 
            className="cb" 
            onClick={() => { engineRef.current?.stop(); onSkip?.(); }}
            style={{ fontSize: '14px', width: 'auto', padding: '0 12px', background: 'rgba(15, 23, 42, 0.05)', border: 'none', color: 'var(--text2)', fontWeight: 600 }}
          >
            ข้าม
          </button>
        )}
        <span className="vr-title">{isOnboarding ? '🎙️ จัดการช่วงเสียงของคุณ' : '🎙️ ทดสอบช่วงเสียง'}</span>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f5f7', padding: '4px 12px', borderRadius: '20px'}}>
          <input
            type="range"
            min="0.005" max="0.05" step="0.001"
            value={noiseGate}
            onChange={(e) => handleNoiseGate(parseFloat(e.target.value))}
            style={{width: '60px', accentColor: '#6c5ce7'}}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: '#86868b', fontSize: 13, lineHeight: 1.5, pointerEvents: 'none', marginBottom: 28, padding: '0 20px' }}>
          {isOnboarding && <b>แอปจะปรับคีย์เพลงให้เข้ากับระดับเสียงคุณโดยอัตโนมัติ<br/><br/></b>}
          <b>วิธีวัดช่วงเสียง:</b> สูดลมหายใจลึกๆ กดเริ่มวัด แล้วร้องเสียง "อ้า" จาก <u>เสียงต่ำที่สุด</u> ไล่ยาวไปจนถึง <u>เสียงสูงที่สุด</u> ที่คุณออกเสียงได้ชัดเจน
        </p>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          {isListening && <canvas ref={canvasRef} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }} />}
          <div className={`pitch-circle ${isListening ? 'on' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
            <div className="nn">{curNote}</div>
            {isListening && <div className="hz">{curFreq} Hz</div>}
          </div>
        </div>

        {isListening && (
          <div className="cents-bar">
            <div className="cents-dot" style={{ left: `${Math.max(0, Math.min(100, 50 + centsOff))}%`, transition: 'left 0.1s ease-out' }} />
          </div>
        )}

        <div className="range-info">
          <div className="rb">
            <div className="rl">ต่ำสุด</div>
            <div className="rv">{lowMidi !== null ? midiToNoteName(lowMidi) : '—'}</div>
          </div>
          <div className="rb">
            <div className="rl">สูงสุด</div>
            <div className="rv">{highMidi !== null ? midiToNoteName(highMidi) : '—'}</div>
          </div>
          <div className="rb">
            <div className="rl">Range</div>
            <div className="rv">{lowMidi !== null && highMidi !== null ? `${highMidi - lowMidi} ST` : '—'}</div>
          </div>
        </div>

        {voiceType && <div className="voice-label">🎤 Voice Type: {voiceType}</div>}

        {saved && (
          <div style={{
            background: 'linear-gradient(135deg, #00b894, #00cec9)', borderRadius: 12,
            padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16,
          }}>
            ✅ บันทึกแล้ว! บทเรียนทั้งหมดจะปรับตามเสียงของคุณ
          </div>
        )}
      </div>

      <div className="vr-actions">
        {!isListening ? (
          <>
            <button className="btn-p" onClick={startListening}>เริ่มวัด</button>
            {voiceType && !saved && (
              <button className="btn-p" style={{ background: '#00b894' }} onClick={handleSave}>
                💾 บันทึกผลและปรับบทเรียน
              </button>
            )}
          </>
        ) : (
          <button className="btn-p" style={{ background: '#e17055' }} onClick={stopListening}>หยุด</button>
        )}
        {(lowMidi !== null) && !isListening && (
          <button className="btn-s" onClick={reset}>วัดใหม่</button>
        )}
      </div>
    </div>
  );
}
