import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioEngine } from '../lib/audioEngine';
import { frequencyToMidi, midiToNoteName, midiToFrequency } from '../lib/noteUtils';
import type { Exercise } from '../lib/exercises';
import { updateStatsAfterPractice } from '../lib/statsManager';

interface Props { exercise: Exercise; onBack: () => void; }

interface PitchEntry { time: number; midi: number; }

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: number;
  color: string;
}

export default function PracticeView({ exercise, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const pitchRef = useRef<number | null>(null);
  const historyRef = useRef<PitchEntry[]>([]);
  const playedNotesRef = useRef<Set<number>>(new Set());
  const scoredNotesRef = useRef<Set<number>>(new Set());
  const startRef = useRef(0);
  const pausedAtRef = useRef(0);
  const scoreRef = useRef({ hits: 0, total: 0, perfect: 0, good: 0, combo: 0, maxCombo: 0 });
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const textIdRef = useRef(0);
  const lastComboRef = useRef(0);
  const noteScoresRef = useRef(new Map<number, { frames: number; perfect: number; good: number }>());
  const bgNoiseRef = useRef<number[]>([]);
  const countdownRef = useRef(3);

  const [noiseGate, setNoiseGate] = useState(0.015);
  const [countdown, setCountdown] = useState(3);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [curNote, setCurNote] = useState('—');
  const [progress, setProgress] = useState(0);
  const [combo, setCombo] = useState(0);
  const [finalScore, setFinalScore] = useState({ hits: 0, total: 0, perfect: 0, good: 0, maxCombo: 0 });
  const [pitchFeedback, setPitchFeedback] = useState<'perfect' | 'high' | 'low' | null>(null);

  // Compute note range for display
  const allMidis = exercise.notes.map(n => n.midi);
  const minMidi = Math.min(...allMidis) - 4;
  const maxMidi = Math.max(...allMidis) + 4;
  const totalBeats = Math.max(...exercise.notes.map(n => n.startBeat + n.durationBeats)) + 2;

  // Start audio engine ONCE on mount
  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;
    engine.onPitchDetected = (freq, vol) => {
      pitchRef.current = freq;
      
      // Auto-Calibration logic during countdown
      if (countdownRef.current > 0) {
         bgNoiseRef.current.push(vol);
      }

      if (freq) {
        const midi = frequencyToMidi(freq);
        const name = midiToNoteName(Math.round(midi));
        setCurNote(prev => prev !== name ? name : prev);
        historyRef.current.push({ time: performance.now(), midi });
        if (historyRef.current.length > 200) historyRef.current.shift();
      }
    };
    engine.start().catch(() => alert('ไม่สามารถเข้าถึงไมโครโฟนได้'));
  }, []);

  // Handle tuning change
  const handleNoiseGate = (val: number) => {
    setNoiseGate(val);
    if (engineRef.current) engineRef.current.noiseGate = val;
  };

  // Countdown & Auto Calibration
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => {
      const next = countdown - 1;
      countdownRef.current = next;
      setCountdown(next);
      
      // Finalize calibration when reaching 1
      if (next === 1 && bgNoiseRef.current.length > 0) {
        const sortedNoise = [...bgNoiseRef.current].sort((a,b)=>a-b);
        const p90Noise = sortedNoise[Math.floor(sortedNoise.length * 0.9)] || 0;
        // add 0.005 padding to base noise level to filter out hums
        const recommendedGate = Math.max(0.005, Math.min(0.05, p90Noise + 0.005));
        handleNoiseGate(Number(recommendedGate.toFixed(3)));
      }

      if (next === 0) { setRunning(true); startRef.current = performance.now(); }
    }, 800);
    return () => clearTimeout(t);
  }, [countdown]);

  // Toggle pause
  const togglePause = useCallback(() => {
    if (paused) {
      const pausedDuration = performance.now() - pausedAtRef.current;
      startRef.current += pausedDuration;
      setPaused(false);
    } else {
      pausedAtRef.current = performance.now();
      setPaused(true);
    }
  }, [paused]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const rect = cvs.parentElement!.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      cvs.style.width = rect.width + 'px';
      cvs.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const noteCount = maxMidi - minMidi + 1;
    const LABEL_W = 38;

    function draw() {
      if (!canvas) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const rowH = h / noteCount;
      const PLAYHEAD_X = LABEL_W + 60;
      const PX_PER_BEAT = 90;

      let beatsElapsed = -4; // Provide 4 beats of lead-in visually
      if (running && !paused) {
        beatsElapsed = -4 + ((performance.now() - startRef.current) / 60000) * exercise.bpm;
      } else if (paused && pausedAtRef.current > 0) {
        beatsElapsed = -4 + ((pausedAtRef.current - startRef.current) / 60000) * exercise.bpm;
      }
      const scrollX = beatsElapsed * PX_PER_BEAT;

      // Note ended, finalize scoring
      if (totalBeats > 0 && beatsElapsed > totalBeats + 1 && running && !paused && !finished) {
        setRunning(false);
        const finalScoreData = { ...scoreRef.current };
        setFinalScore(finalScoreData);
        
        // บันทึกสถิติ
        updateStatsAfterPractice(
          exercise.id,
          finalScoreData.perfect,
          finalScoreData.good,
          finalScoreData.maxCombo,
          finalScoreData.total
        );
        
        // Stop pitch detection immediately
        if (engineRef.current) {
          engineRef.current.onPitchDetected = null;
        }
        // Show results immediately without delay
        setFinished(true);
      }

      setProgress(Math.min(beatsElapsed / totalBeats, 1));

      // Draw rows & labels
      for (let i = 0; i < noteCount; i++) {
        const midi = maxMidi - i;
        const y = i * rowH;
        const isSharp = [1, 3, 6, 8, 10].includes(midi % 12);

        // Row background
        if (isSharp) {
          ctx.fillStyle = '#f8f9fa';
          ctx.fillRect(LABEL_W, y, w - LABEL_W, rowH);
        }

        // Row line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(LABEL_W, y + rowH);
        ctx.lineTo(w, y + rowH);
        ctx.stroke();

        // Label
        ctx.fillStyle = isSharp ? '#cbd5e1' : '#94a3b8';
        ctx.font = '500 10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(midiToNoteName(midi), LABEL_W - 5, y + rowH / 2);
      }

      // Label separator
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LABEL_W, 0);
      ctx.lineTo(LABEL_W, h);
      ctx.stroke();

      // Draw target note blocks
      for (const note of exercise.notes) {
        const x = PLAYHEAD_X + note.startBeat * PX_PER_BEAT - scrollX;
        const bw = note.durationBeats * PX_PER_BEAT - 4;
        const rowIdx = maxMidi - note.midi;
        const y = rowIdx * rowH + rowH * 0.12;
        const bh = rowH * 0.76;

        if (x + bw < LABEL_W || x > w) continue;

        const noteStart = note.startBeat;
        const noteEnd = note.startBeat + note.durationBeats;
        const isActive = running && beatsElapsed >= noteStart && beatsElapsed <= noteEnd;

        // Play Tone if active and not played
        const noteIndex = exercise.notes.indexOf(note);
        if (isActive && !playedNotesRef.current.has(noteIndex)) {
          playedNotesRef.current.add(noteIndex);
          const durationMs = note.durationBeats * (60000 / exercise.bpm);
          engineRef.current?.playTone(midiToFrequency(note.midi), durationMs, note.syllable);
        }
        
        // Hide reference chords completely from the screen
        if (note.isChord) continue;

        // Score: Sustain evaluation logic
        let isHit = false;
        let hitQuality: 'perfect' | 'good' | 'miss' = 'miss';
        
        // Active frame evaluation
        if (!note.isChord && isActive && running && !paused) {
          let scoreData = noteScoresRef.current.get(noteIndex);
          if (!scoreData) {
            scoreData = { frames: 0, perfect: 0, good: 0 };
            noteScoresRef.current.set(noteIndex, scoreData);
          }
          scoreData.frames++;

          if (pitchRef.current) {
            const userMidi = frequencyToMidi(pitchRef.current);
            const diff = userMidi - note.midi;
            const absDiff = Math.abs(diff);
            
            // Real-time feedback
            if (absDiff < 0.5) {
              isHit = true;
              hitQuality = 'perfect';
              scoreData.perfect++;
              setPitchFeedback('perfect');
            } else if (absDiff < 1.0) {
              isHit = true;
              hitQuality = 'good';
              scoreData.good++;
              setPitchFeedback(diff > 0 ? 'high' : 'low');
            } else {
              setPitchFeedback(diff > 0 ? 'high' : 'low');
            }
          }
        } 
        
        // Finalize sustained score at the end of the note
        if (!note.isChord && running && !paused && beatsElapsed > noteEnd) {
          if (!scoredNotesRef.current.has(noteIndex)) {
            scoredNotesRef.current.add(noteIndex);
            scoreRef.current.total++;
            
            const scoreData = noteScoresRef.current.get(noteIndex) || { frames: 0, perfect: 0, good: 0 };
            const scorePct = scoreData.frames > 0 ? (scoreData.perfect + scoreData.good * 0.5) / scoreData.frames : 0;
            
            let finalHitQuality: 'perfect' | 'great' | 'good' | 'miss' = 'miss';
            if (scoreData.frames > 5) { // Needs minimum frames to qualify as a valid hold note
              if (scorePct >= 0.70) finalHitQuality = 'perfect';
              else if (scorePct >= 0.50) finalHitQuality = 'great';
              else if (scorePct >= 0.30) finalHitQuality = 'good';
            }
            
            if (finalHitQuality === 'miss') {
              scoreRef.current.combo = 0;
            } else {
              scoreRef.current.hits++;
              scoreRef.current.combo++;
              if (finalHitQuality === 'perfect') scoreRef.current.perfect++;
              if (finalHitQuality === 'good') scoreRef.current.good++;
              
              if (scoreRef.current.combo > scoreRef.current.maxCombo) {
                scoreRef.current.maxCombo = scoreRef.current.combo;
              }
            }

            if (lastComboRef.current !== scoreRef.current.combo) {
              lastComboRef.current = scoreRef.current.combo;
              setCombo(scoreRef.current.combo);
            }

            // Floating feedback at the very end of the block (Only show positive feedback)
            if (finalHitQuality !== 'miss') {
              if (floatingTextsRef.current.length < 5) {
                floatingTextsRef.current.push({
                  id: textIdRef.current++,
                  text: scoreRef.current.combo >= 5 ? '🔥 COMBO!' : finalHitQuality.toUpperCase(),
                  x: x + bw,
                  y: y - 20,
                  opacity: 1,
                  color: finalHitQuality === 'perfect' ? '#00b894' : finalHitQuality === 'great' ? '#0984e3' : '#fdcb6e'
                });
              }
            }
          }
        }

        // Block style with glow effect for hits
        const radius = bh / 2;
        
        if (isHit && hitQuality === 'perfect') {
          // Perfect hit - neon glow effect
          const glowGrad = ctx.createRadialGradient(x + bw/2, y + bh/2, 0, x + bw/2, y + bh/2, bh);
          glowGrad.addColorStop(0, 'rgba(0, 184, 148, 0.6)');
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(x + bw/2, y + bh/2, bh * 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#00b894';
          ctx.shadowColor = '#00b894';
          ctx.shadowBlur = 15;
        } else if (isHit && hitQuality === 'good') {
          ctx.fillStyle = '#fdcb6e';
          ctx.shadowColor = '#fdcb6e';
          ctx.shadowBlur = 10;
        } else if (isActive) {
          ctx.fillStyle = '#6c5ce7';
          ctx.shadowColor = '#6c5ce7';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#64748b'; // Slate 500 for non-active notes
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(bw, 20), bh, radius);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Visual Fill Bar (Sustained Feedback) within the physical block!
        if (!note.isChord && isActive) {
          const scoreData = noteScoresRef.current.get(noteIndex);
          if (scoreData && scoreData.frames > 0) {
            const fillPct = (scoreData.perfect + scoreData.good * 0.5) / scoreData.frames;
            const fillWidth = fillPct * Math.max(bw, 20);
            
            ctx.fillStyle = fillPct >= 0.75 ? 'rgba(0, 184, 148, 0.4)' : fillPct >= 0.4 ? 'rgba(253, 203, 110, 0.4)' : 'rgba(235, 77, 75, 0.4)';
            ctx.beginPath();
            ctx.roundRect(x, y, fillWidth, bh, radius);
            ctx.fill();
          }
        }

        // Text
        if (!note.isChord && bw > 25) {
          ctx.fillStyle = '#fff';
          ctx.font = '600 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.syllable, x + bw / 2, y + bh / 2);
        }
      }

      // Draw playhead line
      ctx.strokeStyle = 'rgba(108,92,231,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLAYHEAD_X, 0);
      ctx.lineTo(PLAYHEAD_X, h);
      ctx.stroke();

      // Draw pitch trail (wavy line) - only when running and not finished
      const history = historyRef.current;
      if (history.length > 1 && running && !finished) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(108,92,231,0.6)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        let started = false;
        let lastTime = 0;
        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          const secAgo = (performance.now() - entry.time) / 1000;
          const beatAgo = secAgo * (exercise.bpm / 60);
          const x = PLAYHEAD_X - beatAgo * PX_PER_BEAT;
          if (x < LABEL_W) continue;
          const rowIdx = maxMidi - entry.midi;
          const y = rowIdx * rowH + rowH / 2;
          
          // Break line if gap between pitched frames is > 60ms (singer paused or gap detected)
          if (!started || (entry.time - lastTime > 60)) { 
            ctx.moveTo(x, y); 
            started = true; 
          } else { 
            ctx.lineTo(x, y); 
          }
          lastTime = entry.time;
        }
        ctx.stroke();
      }

      // Draw current pitch dot - only when running and not finished
      if (pitchRef.current && running && !finished) {
        const userMidi = frequencyToMidi(pitchRef.current);
        const rowIdx = maxMidi - userMidi;
        const py = rowIdx * rowH + rowH / 2;
        if (py > 0 && py < h) {
          // Glow
          const grad = ctx.createRadialGradient(PLAYHEAD_X, py, 0, PLAYHEAD_X, py, 22);
          grad.addColorStop(0, 'rgba(108,92,231,0.5)');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(PLAYHEAD_X, py, 22, 0, Math.PI * 2);
          ctx.fill();
          // Dot
          ctx.fillStyle = '#6c5ce7';
          ctx.beginPath();
          ctx.arc(PLAYHEAD_X, py, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw floating texts
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => {
        ft.y -= 1.5;
        ft.opacity -= 0.015;
        
        if (ft.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = ft.opacity;
          ctx.fillStyle = ft.color;
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = ft.color;
          ctx.shadowBlur = 8;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
          return true;
        }
        return false;
      });

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [running, paused, finished, exercise, maxMidi, minMidi, totalBeats]);

  return (
    <div className="pv" style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="pv-head" style={{flexWrap: 'wrap', gap: '10px', opacity: finished ? 0 : 1, transition: 'opacity 0.3s'}}>
        <div className="mic-ind"><span className="mic-dot" /> {finished ? '—' : curNote}</div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f5f7', padding: '4px 12px', borderRadius: '20px'}}>
          <span style={{fontSize: 12, fontWeight: 600, color: '#888'}}>TUNE MIC:</span>
          <input 
            type="range" 
            min="0.005" max="0.05" step="0.001" 
            value={noiseGate} 
            onChange={(e) => handleNoiseGate(parseFloat(e.target.value))}
            style={{width: '80px', accentColor: '#6c5ce7'}}
          />
        </div>

        <div className="pv-ctrls">
          {running && <button className="cb" onClick={togglePause}>{paused ? '▶' : '⏸'}</button>}
          <button className="cb" onClick={onBack}>✕</button>
        </div>
      </div>

      <div className="pv-canvas">
        <canvas ref={canvasRef} />
        {countdown > 0 && (
          <div className="cd-overlay">
             <div className="cd-num" key={countdown}>{countdown}</div>
             <div style={{ position: 'absolute', bottom: '20%', fontSize: 16, color: '#a78bfa', fontWeight: 600, textShadow: '0 0 10px rgba(167,139,250,0.5)' }}>
                {countdown > 1 ? 'กำลังวิเคราะห์เสียงรบกวนในห้อง...' : 'ไมค์พร้อมใช้งาน!'}
             </div>
          </div>
        )}
        {finished && (() => {
          const finalScorePct = finalScore.total > 0 ? Math.round((finalScore.hits / finalScore.total) * 100) : 0;
          return (
            <div className="res-overlay">
              <div className="result-stars">
                {[1, 2, 3].map(star => (
                  <span 
                    key={star} 
                    className={`star ${finalScorePct >= star * 30 ? 'active' : ''}`}
                    style={{ animationDelay: `${star * 0.15}s` }}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <h2 style={{ margin: '16px 0 8px' }}>
                {finalScorePct >= 90 ? 'เยี่ยมมาก!' : finalScorePct >= 70 ? 'ดีมาก!' : finalScorePct >= 50 ? 'ดี!' : 'ลองอีกครั้ง!'}
              </h2>
              <div className="score-big">{finalScorePct}%</div>
              
              <div className="res-stats">
                <div className="stat">
                  <div className="stat-v" style={{ color: '#00b894' }}>{finalScore.perfect}</div>
                  <div className="stat-l">Perfect</div>
                </div>
                <div className="stat">
                  <div className="stat-v" style={{ color: '#fdcb6e' }}>{finalScore.good}</div>
                  <div className="stat-l">Good</div>
                </div>
                <div className="stat">
                  <div className="stat-v" style={{ color: '#6c5ce7' }}>{finalScore.maxCombo}</div>
                  <div className="stat-l">Max Combo</div>
                </div>
              </div>

              <button className="btn-p" onClick={() => { 
                  setFinished(false); 
                  setCountdown(3); 
                  scoreRef.current = { hits: 0, total: 0, perfect: 0, good: 0, combo: 0, maxCombo: 0 }; 
                  historyRef.current = [];
                  playedNotesRef.current.clear();
                  scoredNotesRef.current.clear();
                  noteScoresRef.current.clear();
                  bgNoiseRef.current = [];
                  floatingTextsRef.current = [];
                  countdownRef.current = 3;
                  setCombo(0);
                  setCurNote('—');
                  pitchRef.current = null;
                  // Restart pitch detection
                  if (engineRef.current) {
                    engineRef.current.onPitchDetected = (freq, vol) => {
                      pitchRef.current = freq;
                      if (countdownRef.current > 0) {
                        bgNoiseRef.current.push(vol);
                      }
                      if (freq) {
                        const midi = frequencyToMidi(freq);
                        const name = midiToNoteName(Math.round(midi));
                        setCurNote(prev => prev !== name ? name : prev);
                        historyRef.current.push({ time: performance.now(), midi });
                        if (historyRef.current.length > 200) historyRef.current.shift();
                      }
                    };
                  }
                }}>ลองอีกครั้ง</button>
              <button className="btn-s" onClick={onBack}>กลับ</button>
            </div>
          );
        })()}
      </div>

      <div className="pv-foot" style={{opacity: finished ? 0 : 1, transition: 'opacity 0.3s'}}>
        <div className="prog"><div className="prog-fill" style={{ width: `${progress * 100}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="cur-note">{finished ? '—' : curNote}</div>
          {combo > 0 && running && !finished && (
            <div className="combo-display" key={combo}>
              {combo}x COMBO
            </div>
          )}
        </div>
        {/* Real-time pitch feedback */}
        {running && !finished && !paused && pitchFeedback && (
          <div style={{
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '8px',
            background: pitchFeedback === 'perfect' ? 'rgba(0, 184, 148, 0.15)' : 'rgba(253, 203, 110, 0.15)',
            color: pitchFeedback === 'perfect' ? '#00b894' : '#fdcb6e',
            animation: 'fadeIn 0.2s ease'
          }}>
            {pitchFeedback === 'perfect' && '✓ ถูกต้อง!'}
            {pitchFeedback === 'high' && '↓ เสียงสูงไป'}
            {pitchFeedback === 'low' && '↑ เสียงต่ำไป'}
          </div>
        )}
        {/* Breathing tip */}
        {exercise.breathingTip && countdown > 0 && (
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '8px',
            lineHeight: 1.4
          }}>
            💡 {exercise.breathingTip}
          </div>
        )}
      </div>
    </div>
  );
}
