import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, Play, Pause, Lightbulb, RotateCcw, Activity, Sparkles, 
  Trophy, Award, Zap, Crown, Mic, Flame, Sliders, Music 
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { frequencyToMidi, midiToNoteName, midiToFrequency } from '../lib/noteUtils';
import type { Exercise } from '../lib/exercises';
import { ACHIEVEMENTS } from '../lib/achievements';
import { generatePracticeTips } from '../lib/adaptiveDifficulty';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStatsStore } from '../stores/useStatsStore';
import { useAudioSession } from '../hooks/useAudioSession';
import { usePracticeSession } from '../hooks/usePracticeSession';

interface Props { 
  exercise: Exercise; 
  onBack: () => void; 
}

interface PitchEntry { 
  time: number; 
  midi: number; 
}

export default function PracticeView({ exercise, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pitchRef = useRef<number | null>(null);
  const historyRef = useRef<PitchEntry[]>([]);
  const bgNoiseRef = useRef<number[]>([]);
  const countdownRef = useRef(3);
  const startPlayTimeRef = useRef(0);
  
  const volumeRef = useRef(0);
  const comboRef = useRef(0);
  
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
  }
  const particlesRef = useRef<Particle[]>([]);

  const [noiseGate, setNoiseGate] = useState(0.015);
  const [countdown, setCountdown] = useState(3);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [curNote, setCurNote] = useState('—');
  const [progress, setProgress] = useState(0);
  const [showTips, setShowTips] = useState(false);
  
  const { newlyUnlockedAchievements, clearNewlyUnlocked } = useProgressStore();
  const [showAchievementToast, setShowAchievementToast] = useState(false);
  const [currentToastIdx, setCurrentToastIdx] = useState(0);

  function getAchievementIcon(iconName: string, size = 24) {
    switch (iconName) {
      case 'Music': return <Music size={size} />;
      case 'Flame': return <Flame size={size} />;
      case 'Trophy': return <Trophy size={size} />;
      case 'Award': return <Award size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Sliders': return <Sliders size={size} />;
      case 'Crown': return <Crown size={size} />;
      case 'Mic': return <Mic size={size} />;
      default: return <Award size={size} />;
    }
  }

  const [practiceTips] = useState<string[]>(() => {
    const tips = generatePracticeTips(exercise, null);
    return ["คะแนนต้องร้องให้เสียงอยู่ในแถบโน้ตอย่างต่อเนื่อง ไม่ใช่แค่แตะผ่านๆ", ...tips];
  });

  const { latencySettings } = useSettingsStore();

  // Integrated hooks
  const {
    combo,
    finalScore,
    pitchFeedback,
    hasPlayedNote,
    markNotePlayed,
    updateNoteScore,
    finalizeNoteScore,
    finishSession,
    resetSession,
    getNoteScoreData
  } = usePracticeSession();

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    if (newlyUnlockedAchievements.length > 0) {
      setShowAchievementToast(true);
      setCurrentToastIdx(0);
    }
  }, [newlyUnlockedAchievements]);

  const handlePitchDetected = useCallback((freq: number | null, vol: number, noteName: string) => {
    pitchRef.current = freq;
    volumeRef.current = vol;
    setCurNote(noteName);
    
    if (countdownRef.current > 0) {
      bgNoiseRef.current.push(vol);
    }
    
    if (freq) {
      const midi = frequencyToMidi(freq);
      historyRef.current.push({ time: performance.now(), midi });
      if (historyRef.current.length > 200) historyRef.current.shift();
    }
  }, []);

  const { engine, updateNoiseGate, resetPitchHistory } = useAudioSession(handlePitchDetected, noiseGate);

  const allMidis = exercise.notes.map(n => n.midi);
  const minMidi = Math.min(...allMidis) - 4;
  const maxMidi = Math.max(...allMidis) + 4;
  const totalBeats = Math.max(...exercise.notes.map(n => n.startBeat + n.durationBeats)) + 2;

  const handleNoiseGate = (val: number) => {
    setNoiseGate(val);
    updateNoiseGate(val);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const msPerBeat = 60000 / exercise.bpm;
    
    if (countdown <= 3 && engine) {
      const firstNoteMidi = exercise.notes.find(n => !n.isChord)?.midi || exercise.startingNote;
      engine.playTone(midiToFrequency(firstNoteMidi), msPerBeat * 0.5, 'Count', 0);
    }

    const t = setTimeout(() => {
      const next = countdown - 1;
      countdownRef.current = next;
      setCountdown(next);
      if (next === 1 && bgNoiseRef.current.length > 0) {
        const sorted = [...bgNoiseRef.current].sort((a,b)=>a-b);
        const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
        handleNoiseGate(Number(Math.max(0.005, Math.min(0.05, p90 + 0.005)).toFixed(3)));
      }
      if (next === 0) { 
        setRunning(true); 
      }
    }, msPerBeat);
    return () => clearTimeout(t);
  }, [countdown, exercise.bpm, exercise.notes, exercise.startingNote, engine]);

  const togglePause = useCallback(() => {
    setPaused(prev => !prev);
  }, []);

  // Sync session timers inside rendering loop
  const startTimerRef = useRef(0);
  const pausedTimeSumRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (running && !paused && !finished) {
      if (startTimerRef.current === 0) {
        startTimerRef.current = performance.now();
        pausedTimeSumRef.current = 0;
      } else if (lastTimeRef.current > 0) {
        // Add paused duration to offset
        pausedTimeSumRef.current += performance.now() - lastTimeRef.current;
      }
    } else if (paused) {
      lastTimeRef.current = performance.now();
    }
  }, [running, paused, finished]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const noteCount = maxMidi - minMidi + 1;
    const LABEL_W = 40;

    // Organic Earthy Palette
    const C_BG = '#fdfbf7'; // sand
    const C_LINE = '#f4f1ea'; // sand-dark
    const C_LABEL = '#a09a95'; // taupe
    const C_TARGET = '#d6c7b0'; // muted target
    const C_ACTIVE_TARGET = '#c98e65'; // ochre-dark
    const C_PERFECT = '#85b09a'; // sage
    const C_GOOD = '#e8a87c'; // ochre
    const C_PITCH_LINE = '#2d3748'; // charcoal

    function draw() {
      if (!canvas) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      
      // Clear with soft background
      ctx.fillStyle = C_BG;
      ctx.fillRect(0, 0, w, h);

      // Glowing ambient soundwave based on volume (RMS)
      const currentVol = volumeRef.current;
      if (currentVol > 0.002 && running && !paused && !finished) {
        ctx.save();
        ctx.strokeStyle = 'rgba(214, 104, 83, 0.08)'; // soft clay color
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(214, 104, 83, 0.4)';
        ctx.beginPath();
        const waveH = h / 2;
        const waveAmp = Math.min(50, currentVol * 350); // Scale volume to amplitude
        
        for (let x = LABEL_W; x < w; x += 4) {
          const time = performance.now() * 0.005;
          const y = waveH + Math.sin(x * 0.01 + time) * waveAmp * Math.sin(x * 0.003);
          if (x === LABEL_W) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Second thinner, faster wave
        ctx.strokeStyle = 'rgba(232, 168, 124, 0.05)'; // soft ochre
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = LABEL_W; x < w; x += 4) {
          const time = performance.now() * 0.008;
          const y = waveH + Math.cos(x * 0.015 - time) * (waveAmp * 0.6) * Math.sin(x * 0.002);
          if (x === LABEL_W) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      const rowH = h / noteCount;
      const PLAYHEAD_X = LABEL_W + 80;
      const PX_PER_BEAT = 100;

      let beatsElapsed = -4; 
      const latencyOffsetMs = (latencySettings.totalCompensation || 0) + (latencySettings.manualOffset || 0);

      if (running && !paused) {
        if (startPlayTimeRef.current === 0) startPlayTimeRef.current = performance.now();
        const activeDuration = performance.now() - startPlayTimeRef.current - pausedTimeSumRef.current;
        beatsElapsed = -4 + ((activeDuration - latencyOffsetMs) / 60000) * exercise.bpm;
      } else if (paused) {
        const activeDuration = lastTimeRef.current - startPlayTimeRef.current - pausedTimeSumRef.current;
        beatsElapsed = -4 + ((activeDuration - latencyOffsetMs) / 60000) * exercise.bpm;
      }

      if (totalBeats > 0 && beatsElapsed > totalBeats + 1 && running && !paused && !finished) {
        setRunning(false);
        const finalData = finishSession();
        
        if (finalData.hits > 0) {
          const progressStore = useProgressStore.getState();
          const statsStore = useStatsStore.getState();
          const scorePercentage = finalData.total > 0 ? Math.round((finalData.hits / finalData.total) * 100) : 0;
          
          progressStore.recordExerciseScore(exercise.id, scorePercentage, finalData.perfect, finalData.good, finalData.total, exercise.name, finalData.maxCombo);
          statsStore.recordPracticeSession(exercise.id, finalData.perfect, finalData.good, finalData.maxCombo, finalData.total);
        }
        
        setFinished(true);
      }

      setProgress(Math.min(beatsElapsed / totalBeats, 1));

      // Draw organic guide lines
      ctx.lineWidth = 1;
      for (let i = 0; i < noteCount; i++) {
        const midi = maxMidi - i;
        const y = i * rowH;
        const isSharp = [1, 3, 6, 8, 10].includes(midi % 12);

        if (isSharp) {
          ctx.fillStyle = C_LINE;
          ctx.fillRect(LABEL_W, y, w - LABEL_W, rowH);
        } else {
          ctx.strokeStyle = 'rgba(200, 195, 185, 0.3)';
          ctx.beginPath(); ctx.moveTo(LABEL_W, y + rowH); ctx.lineTo(w, y + rowH); ctx.stroke();
        }

        ctx.fillStyle = C_LABEL;
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(midiToNoteName(midi), LABEL_W - 8, y + rowH / 2);
      }

      // Target notes (Pills)
      for (const note of exercise.notes) {
        const x = PLAYHEAD_X + note.startBeat * PX_PER_BEAT - scrollX();
        const bw = note.durationBeats * PX_PER_BEAT - 4;
        const rowIdx = maxMidi - note.midi;
        const y = rowIdx * rowH + rowH * 0.15;
        const bh = rowH * 0.7;

        if (x + bw < LABEL_W || x > w) continue;

        const isActive = running && beatsElapsed >= note.startBeat && beatsElapsed <= note.startBeat + note.durationBeats;
        const noteIndex = exercise.notes.indexOf(note);

        if (isActive && !hasPlayedNote(noteIndex)) {
          markNotePlayed(noteIndex);
          engine?.playTone(midiToFrequency(note.midi), note.durationBeats * (60000 / exercise.bpm), note.syllable);
        }
        
        if (note.isChord) continue;

        if (isActive && running && !paused) {
          if (pitchRef.current) {
            const diff = Math.abs(frequencyToMidi(pitchRef.current) - note.midi);
            updateNoteScore(noteIndex, diff);
          } else {
            updateNoteScore(noteIndex, null);
          }
        }
        
        if (running && !paused && beatsElapsed > note.startBeat + note.durationBeats) {
          finalizeNoteScore(noteIndex);
        }

        const radius = bh / 2;
        
        // Base Pill
        ctx.fillStyle = isActive ? C_ACTIVE_TARGET : C_TARGET;
        ctx.beginPath(); ctx.roundRect(x, y, Math.max(bw, 20), bh, radius); ctx.fill();

        // Inner fill
        const sData = getNoteScoreData(noteIndex);
        if (sData && sData.frames > 0) {
          const fillPct = (sData.perfect + sData.good * 0.5) / sData.frames;
          ctx.fillStyle = fillPct >= 0.7 ? C_PERFECT : fillPct >= 0.4 ? C_GOOD : 'rgba(200, 107, 81, 0.8)';
          ctx.beginPath(); ctx.roundRect(x, y, fillPct * Math.max(bw, 20), bh, radius); ctx.fill();
        }

        if (bw > 30) {
          ctx.fillStyle = '#fff';
          ctx.font = '700 12px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(note.syllable, x + bw / 2, y + bh / 2);
        }
      }

      function scrollX() {
        return beatsElapsed * PX_PER_BEAT;
      }

      // Playhead
      ctx.strokeStyle = 'rgba(45, 55, 72, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PLAYHEAD_X, 0); ctx.lineTo(PLAYHEAD_X, h); ctx.stroke();

      // Organic Pitch Trail
      const history = historyRef.current;
      if (history.length > 1 && running && !finished) {
        ctx.beginPath();
        ctx.strokeStyle = C_PITCH_LINE;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let started = false;
        let lastTime = 0;
        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          const x = PLAYHEAD_X - ((performance.now() - entry.time) / 1000) * (exercise.bpm / 60) * PX_PER_BEAT;
          if (x < LABEL_W) continue;
          const y = (maxMidi - entry.midi) * rowH + rowH / 2;
          if (!started || (entry.time - lastTime > 80)) { ctx.moveTo(x, y); started = true; } 
          else { ctx.lineTo(x, y); }
          lastTime = entry.time;
        }
        ctx.stroke();
      }

      // Spawn particles when pitch detected and combo is active
      if (pitchRef.current && running && !finished && comboRef.current > 0) {
        const py = (maxMidi - frequencyToMidi(pitchRef.current)) * rowH + rowH / 2;
        if (py > 0 && py < h) {
          const spawnCount = Math.min(3, Math.ceil(comboRef.current / 10));
          const colors = ['#85b09a', '#e8a87c', '#d66853', '#f4d068']; // sage, ochre, clay, gold
          for (let s = 0; s < spawnCount; s++) {
            particlesRef.current.push({
              x: PLAYHEAD_X,
              y: py,
              vx: (Math.random() - 0.7) * 2 - 1, // Drifts slightly left
              vy: (Math.random() - 0.5) * 3,
              alpha: 1,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 3 + 2
            });
          }
        }
      }

      // Update and Draw Particles
      if (particlesRef.current.length > 0) {
        ctx.save();
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025; // Fade out
          
          if (p.alpha <= 0 || p.x < LABEL_W) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Current Pitch Dot
      if (pitchRef.current && running && !finished) {
        const py = (maxMidi - frequencyToMidi(pitchRef.current)) * rowH + rowH / 2;
        if (py > 0 && py < h) {
          ctx.fillStyle = C_PITCH_LINE;
          ctx.beginPath(); ctx.arc(PLAYHEAD_X, py, 6, 0, Math.PI * 2); ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [running, paused, finished, exercise, maxMidi, minMidi, totalBeats, hasPlayedNote, markNotePlayed, updateNoteScore, finalizeNoteScore, getNoteScoreData, engine]);

  return (
    <div className="fixed inset-0 flex flex-col bg-sand text-charcoal overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 select-none">
      {/* Header */}
      <div className={`flex-none px-6 py-4 flex items-center justify-between z-10 transition-opacity duration-300 ${finished ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-sage shadow-[0_0_8px_rgba(133,176,154,0.8)] animate-pulse" />
            <span className="text-sm font-bold w-6 text-center">{finished ? '—' : curNote}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm">
            <input type="range" min="0.005" max="0.05" step="0.001" value={noiseGate} onChange={(e) => handleNoiseGate(parseFloat(e.target.value))} className="w-16 accent-clay cursor-pointer" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowTips(!showTips)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm border border-stone-200 cursor-pointer ${showTips ? 'bg-clay text-white' : 'bg-white text-charcoal hover:bg-stone-100'}`}>
            <Lightbulb size={20} />
          </button>
          {running && <button onClick={togglePause} className="w-12 h-12 rounded-full bg-white text-charcoal shadow-sm border border-stone-200 flex items-center justify-center hover:bg-stone-100 cursor-pointer">{paused ? <Play size={20} className="ml-1" /> : <Pause size={20} />}</button>}
          <button onClick={onBack} className="w-12 h-12 rounded-full bg-white text-charcoal shadow-sm border border-stone-200 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"><X size={20} /></button>
        </div>
      </div>

      {showTips && !finished && (
        <div className="absolute top-20 left-6 right-6 z-20 bg-white/90 backdrop-blur-xl border border-stone-200 rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="text-clay font-bold mb-4 flex items-center gap-2 text-lg"><Lightbulb size={20} /> คำแนะนำการฝึกซ้อม</div>
          <div className="space-y-3">
            {practiceTips.map((tip, i) => (
              <div key={i} className="text-base font-medium text-charcoal/80 flex items-start gap-3"><span className="text-clay mt-1">•</span> {tip}</div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-sand-dark">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        
        {countdown > 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-sand/80 backdrop-blur-sm">
             <div key={countdown} className="text-[10rem] font-black text-clay animate-in zoom-in-50 duration-300">{countdown}</div>
             <div className="absolute bottom-24 text-xl text-clay-dark font-bold tracking-widest uppercase">{countdown > 1 ? 'กำลังวิเคราะห์เสียงรบกวน...' : 'หายใจเข้าลึกๆ & เตรียมพร้อม'}</div>
          </div>
        )}

        {finished && (() => {
          const finalScorePct = finalScore.total > 0 ? Math.round((finalScore.hits / finalScore.total) * 100) : 0;
          
          let coachFeedback = "ไม่พบเสียงร้อง ตรวจสอบให้แน่ใจว่าคุณร้องใกล้ไมโครโฟน";
          if (finalScore.total > 0) {
            const hitRate = finalScore.hits / finalScore.total;
            const perfectRate = finalScore.perfect / finalScore.total;
            const goodRate = finalScore.good / finalScore.total;
            
            if (hitRate >= 0.95) coachFeedback = "ความแม่นยำของระดับเสียงยอดเยี่ยมมาก! การควบคุมลมหายใจและเสียงกังวานของคุณสอดคล้องกันอย่างสมบูรณ์แบบ";
            else if (hitRate >= 0.8) {
              if (goodRate > perfectRate) coachFeedback = "เก่งมาก! คุณร้องโดนโน้ตแล้ว แต่ยังมีแกว่งนิดหน่อย ลองโฟกัสที่การประคองลมหายใจให้นิ่งเพื่อล็อคระดับเสียงให้เป๊ะขึ้น";
              else coachFeedback = "ดีมาก! มีเสียงแกว่งนิดหน่อยเท่านั้น พยายามผ่อนคลายลำคอและดันเสียงไปข้างหน้า";
            }
            else if (hitRate >= 0.5) coachFeedback = "ใกล้จะเป๊ะแล้ว! ถ้าเสียงยังแกว่งอยู่ ลองเกร็งกล้ามเนื้อหน้าท้อง (กะบังลม) เพิ่มขึ้นเพื่อประคองกระแสลมให้นิ่ง";
            else coachFeedback = "ฝึกต่อไปนะ! ลองจินตนาการถึงเสียงโน้ตก่อนร้องออกมา หรือลองฮัมเพลงดูก่อนเพื่อหาตำแหน่งเสียงที่ถูกต้อง";
          }

          return (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-sand/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-500 p-6 overflow-y-auto pt-24">
              <h2 className="text-4xl font-black text-charcoal mb-4">{finalScorePct >= 90 ? 'ยอดเยี่ยมมาก!' : finalScorePct >= 70 ? 'ร้องประสานได้ดี!' : finalScorePct >= 50 ? 'พยายามได้ดี!' : 'ฝึกฝนต่อไป!'}</h2>
              <div className="text-8xl font-black text-clay mb-8">{finalScorePct}%</div>
              
              <div className="flex gap-4 mb-8 w-full max-w-md">
                <div className="flex-1 bg-white rounded-[2rem] p-6 text-center border border-stone-200 shadow-sm"><div className="text-3xl font-black text-sage-dark mb-2">{finalScore.perfect}</div><div className="text-[10px] font-bold text-taupe uppercase tracking-widest">แม่นยำ</div></div>
                <div className="flex-1 bg-white rounded-[2rem] p-6 text-center border border-stone-200 shadow-sm"><div className="text-3xl font-black text-ochre-dark mb-2">{finalScore.good}</div><div className="text-[10px] font-bold text-taupe uppercase tracking-widest">ใกล้เคียง</div></div>
                <div className="flex-1 bg-white rounded-[2rem] p-6 text-center border border-stone-200 shadow-sm"><div className="text-3xl font-black text-clay-dark mb-2">{finalScore.maxCombo}</div><div className="text-[10px] font-bold text-taupe uppercase tracking-widest">ต่อเนื่อง</div></div>
              </div>

              {/* AI Coach Feedback */}
              <div className="w-full max-w-md bg-white rounded-3xl p-6 mb-8 border border-stone-200 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 text-clay mb-3">
                  <Lightbulb size={20} />
                  <h3 className="font-bold text-lg">AI โค้ชสอนร้องเพลง</h3>
                </div>
                <p className="text-charcoal/80 font-medium">{coachFeedback}</p>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-sm pb-8">
                <button className="w-full bg-clay text-white font-bold py-5 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-clay/20 active:scale-[0.98] transition-all text-lg cursor-pointer"
                  onClick={() => { 
                    setFinished(false); 
                    setCountdown(3); 
                    startPlayTimeRef.current = 0;
                    pausedTimeSumRef.current = 0;
                    countdownRef.current = 3;
                    resetSession();
                    historyRef.current = []; 
                    bgNoiseRef.current = []; 
                    particlesRef.current = [];
                    setCurNote('—'); 
                    pitchRef.current = null;
                    resetPitchHistory();
                  }}><RotateCcw size={20} /> ฝึกอีกครั้ง</button>
                <button className="w-full bg-white text-charcoal font-bold py-5 rounded-full border border-stone-200 active:scale-[0.98] transition-all text-lg cursor-pointer" onClick={onBack}>กลับสู่หน้าหลัก</button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className={`flex-none bg-white border-t border-stone-200 p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] transition-opacity duration-300 ${finished ? 'opacity-0' : 'opacity-100'}`}>
        <div className="h-2 w-full bg-sand rounded-full overflow-hidden mb-6"><div className="h-full bg-clay transition-all duration-300 ease-linear" style={{ width: `${progress * 100}%` }} /></div>
        <div className="flex justify-between items-center h-8">
          <div className="text-4xl font-black text-clay-dark">{finished ? '—' : curNote}</div>
          {combo > 0 && running && !finished && <div className="flex items-center gap-2 bg-clay-light/20 px-4 py-1.5 rounded-full text-clay-dark font-black"><Activity size={18} /> {combo} ต่อเนื่อง</div>}
        </div>
        <div className="h-6 mt-4 flex justify-center">
          {running && !finished && !paused && pitchFeedback && (
            <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold ${pitchFeedback === 'perfect' ? 'bg-sage-light/30 text-sage-dark' : 'bg-ochre-light/30 text-ochre-dark'}`}>
              {pitchFeedback === 'perfect' ? 'ระดับเสียงสมบูรณ์แบบ!' : pitchFeedback === 'high' ? 'ลดเสียงลงนิดนึง' : 'เพิ่มเสียงขึ้นนิดนึง'}
            </div>
          )}
        </div>
      </div>

      {/* Newly Unlocked Achievements Popup */}
      <AnimatePresence>
        {showAchievementToast && newlyUnlockedAchievements.length > 0 && (
          (() => {
            const achId = newlyUnlockedAchievements[currentToastIdx];
            const ach = ACHIEVEMENTS.find(a => a.id === achId);
            if (!ach) return null;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-clay/10 text-center relative overflow-hidden"
                >
                  {/* Sparkle background effects */}
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-ochre/10 rounded-full blur-xl animate-pulse" />
                  <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-clay/10 rounded-full blur-xl animate-pulse" />
                  
                  <div className="flex justify-center mb-6">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                      className="w-20 h-20 bg-gradient-to-br from-clay to-ochre rounded-full flex items-center justify-center shadow-xl text-white"
                    >
                      {getAchievementIcon(ach.iconName, 36)}
                    </motion.div>
                  </div>

                  <div className="text-xs font-bold text-clay uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                    <Sparkles size={12} className="animate-pulse" /> ความสำเร็จใหม่ที่ปลดล็อก!
                  </div>
                  <h3 className="text-2xl font-black text-charcoal mb-2">{ach.name}</h3>
                  <p className="text-sm font-semibold text-taupe mb-6 leading-relaxed">{ach.description}</p>
                  
                  <button
                    onClick={() => {
                      if (currentToastIdx < newlyUnlockedAchievements.length - 1) {
                        setCurrentToastIdx(prev => prev + 1);
                      } else {
                        setShowAchievementToast(false);
                        clearNewlyUnlocked();
                      }
                    }}
                    className="w-full bg-charcoal text-white font-bold py-4 rounded-full shadow-lg hover:bg-clay hover:shadow-clay/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {currentToastIdx < newlyUnlockedAchievements.length - 1 ? 'ถัดไป' : 'ยอดเยี่ยม!'}
                  </button>
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}