import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Waves, ArrowRight, X } from 'lucide-react';
import { AudioEngine } from '../lib/audioEngine';
import { midiToNoteName } from '../lib/noteUtils';
import type { VocalRange } from '../lib/types';

interface Props {
  onBack: () => void;
  onSave: (range: VocalRange) => void;
  isOnboarding?: boolean;
  onSkip?: () => void;
}

export default function VocalRangeView({ onBack, onSave, isOnboarding, onSkip }: Props) {
  const engineRef = useRef<AudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState<'intro' | 'reading' | 'result'>('intro');
  const [isListening, setIsListening] = useState(false);
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [resultRange, setResultRange] = useState<VocalRange | null>(null);
  
  // Real-time visual refs
  const currentVolRef = useRef(0);
  const volumeHistoryRef = useRef<number[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.stop();
    };
  }, []);

  const startReadingTest = async () => {
    setStep('reading');
    setFrequencies([]);
    
    try {
      const engine = new AudioEngine();
      engine.noiseGate = 0.015; // standard spoken voice noise gate
      engineRef.current = engine;
      
      engine.onPitchDetected = (freq, vol) => {
        currentVolRef.current = vol;
        volumeHistoryRef.current.push(vol);
        if (volumeHistoryRef.current.length > 60) volumeHistoryRef.current.shift();
        
        // Only capture stable frequencies within normal human speaking ranges (70Hz to 300Hz)
        if (freq && vol > 0.01 && freq > 70 && freq < 350) {
          setFrequencies(prev => [...prev, freq]);
        }
      };
      
      await engine.start();
      setIsListening(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาตรวจสอบการอนุญาตการใช้งานไมโครโฟน');
      setStep('intro');
    }
  };

  const finishTest = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setIsListening(false);

    if (frequencies.length < 20) {
      alert("เราจับเสียงของคุณได้ไม่มากพอ ลองอ่านข้อความให้นานขึ้นอีกนิดนะ");
      setStep('intro');
      return;
    }

    // Calculate Median Frequency to find natural speaking pitch
    const sorted = [...frequencies].sort((a, b) => a - b);
    const medianFreq = sorted[Math.floor(sorted.length / 2)];
    
    // Mathematical classification based on speaking fundamental frequency (F0)
    let voiceType = 'ทั่วไป';
    let lowMidi = 48; // Default C3
    let highMidi = 72; // Default C5

    if (medianFreq < 100) {
      voiceType = 'เบส';
      lowMidi = 36; // C2
      highMidi = 60; // C4
    } else if (medianFreq < 130) {
      voiceType = 'บาริโทน';
      lowMidi = 43; // G2
      highMidi = 67; // G4
    } else if (medianFreq < 165) {
      voiceType = 'เทเนอร์';
      lowMidi = 48; // C3
      highMidi = 72; // C5
    } else if (medianFreq < 200) {
      voiceType = 'อัลโต';
      lowMidi = 53; // F3
      highMidi = 77; // F5
    } else {
      voiceType = 'โซปราโน';
      lowMidi = 60; // C4
      highMidi = 84; // C6
    }

    setResultRange({ lowMidi, highMidi, voiceType });
    setStep('result');
  };

  // Canvas visualizer for voice activity
  useEffect(() => {
    if (step !== 'reading' || !isListening) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 80 * dpr;
    canvas.style.width = '300px';
    canvas.style.height = '80px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, 300, 80);
      const centerY = 40;
      
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      
      const sliceWidth = 300 / 60;
      for (let i = 0; i < 60; i++) {
        const x = i * sliceWidth;
        const vol = volumeHistoryRef.current[i] || 0;
        const vHeight = Math.min(vol * 400, 35); // amplitude
        
        ctx.lineTo(x, centerY - vHeight);
      }
      
      ctx.strokeStyle = '#85b09a'; // Sage color
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Bottom reflection
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let i = 0; i < 60; i++) {
        const x = i * sliceWidth;
        const vol = volumeHistoryRef.current[i] || 0;
        const vHeight = Math.min(vol * 400, 35);
        ctx.lineTo(x, centerY + vHeight);
      }
      ctx.strokeStyle = 'rgba(133, 176, 154, 0.3)';
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(raf);
  }, [step, isListening]);

  return (
    <div className="fixed inset-0 bg-sand flex flex-col items-center justify-center p-6 z-[200]">
      
      {/* Absolute Nav */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 pt-[calc(24px+env(safe-area-inset-top))]">
        {!isOnboarding ? (
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-200 text-charcoal hover:bg-stone-100 transition-colors"
          >
            <X size={20} />
          </button>
        ) : (
          <div /> // Spacer
        )}
        
        {isOnboarding && onSkip && (
          <button 
            onClick={onSkip}
            className="px-5 py-2 rounded-full bg-stone-200/50 text-charcoal/70 font-bold text-sm hover:bg-stone-200 transition-colors"
          >
            ข้ามไปก่อน
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: INTRO */}
        {step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sage-light to-sage-dark flex items-center justify-center text-white mb-8 shadow-xl shadow-sage/20">
              <Mic size={40} />
            </div>
            
            <h1 className="text-3xl font-black text-charcoal mb-4 tracking-tight">
              ค้นหาช่วงเสียงของคุณ
            </h1>
            
            <p className="text-charcoal/70 font-medium leading-relaxed mb-8 text-base">
              อ่านข้อความด้านล่างด้วยน้ำเสียงปกติ เราจะปรับบทเรียนให้เข้ากับเสียงของคุณ
            </p>

            <button 
              onClick={startReadingTest}
              className="w-full bg-charcoal text-white py-5 rounded-full font-black text-lg shadow-xl shadow-charcoal/20 active:scale-95 transition-transform"
            >
              เริ่มทดสอบ
            </button>
          </motion.div>
        )}

        {/* STEP 2: READING TEST */}
        {step === 'reading' && (
          <motion.div 
            key="reading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <div className="bg-white p-6 rounded-[2rem] shadow-lg shadow-stone-200/50 border border-stone-100 mb-6 w-full relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-sage-light/20 rounded-full blur-2xl" />
               
               <div className="relative z-10">
                 <p className="text-lg font-bold text-charcoal leading-relaxed">
                   "ลมหายใจไหลเวียนดั่งสายน้ำ เสียงสะท้อนเกิดขึ้นอย่างเป็นธรรมชาติ เสียงของฉันมีเอกลักษณ์และเป็นตัวของตัวเอง"
                 </p>
               </div>
            </div>

            <div className="h-[80px] mb-6 relative">
              <canvas ref={canvasRef} className="absolute inset-0" />
            </div>

            <p className="text-taupe font-bold uppercase tracking-widest text-xs mb-6 animate-pulse">
              กำลังฟัง...
            </p>

            <button 
              onClick={finishTest}
              className="w-full bg-sage-dark text-white py-4 rounded-full font-bold text-base shadow-xl shadow-sage/30 active:scale-95 transition-transform"
            >
              เสร็จแล้ว
            </button>
          </motion.div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && resultRange && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <div className="w-24 h-24 rounded-full bg-clay-light/20 border-2 border-clay flex items-center justify-center text-clay-dark mb-6 shadow-inner">
              <Waves size={40} />
            </div>
            
            <span className="inline-block px-4 py-1 bg-charcoal/5 rounded-full text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-3 border border-charcoal/10">
              ประเภทเสียงของคุณ
            </span>
            
            <h1 className="text-4xl font-black text-charcoal mb-2 tracking-tight">
              {resultRange.voiceType}
            </h1>
            
            <p className="text-charcoal/70 font-medium leading-relaxed mb-8 text-base">
              ช่วงเสียงของคุณอยู่ระหว่าง <b className="text-charcoal">{midiToNoteName(resultRange.lowMidi)}</b> ถึง <b className="text-charcoal">{midiToNoteName(resultRange.highMidi)}</b>
              <br/>
              <span className="text-sm text-taupe block mt-2">บทเรียนทั้งหมดถูกปรับให้เข้ากับเสียงของคุณแล้ว</span>
            </p>

            <button 
              onClick={() => onSave(resultRange)}
              className="w-full bg-clay hover:bg-clay-dark text-white py-4 rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-clay/20 active:scale-95 transition-all"
            >
              เริ่มใช้งาน <ArrowRight size={20} />
            </button>

            <button 
              onClick={() => setStep('intro')}
              className="mt-4 text-sm font-bold text-taupe hover:text-charcoal transition-colors"
            >
              ทดสอบใหม่
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
