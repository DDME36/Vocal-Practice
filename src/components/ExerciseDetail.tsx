import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Square, Info, Layers, Wind } from 'lucide-react';
import type { Exercise } from '../lib/exercises';
import { AudioEngine } from '../lib/audioEngine';
import { midiToFrequency } from '../lib/noteUtils';

interface Props {
  exercise: Exercise;
  onClose: () => void;
  onStart: () => void;
}

export default function ExerciseDetail({ exercise, onClose, onStart }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const engineRef = useRef<AudioEngine | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const stopPreview = () => {
    setIsPlaying(false);
    setPlayheadPosition(0);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.fadeOutAllTones();
    }
  };

  const startPreview = async () => {
    if (isPlaying) {
      stopPreview();
      return;
    }

    setIsPlaying(true);
    setPlayheadPosition(0);
    
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }

    const engine = engineRef.current;
    
    // Play only the first 12 notes or the whole exercise if it's short
    const notesToPlay = exercise.notes.filter(n => !n.isChord).slice(0, 12);
    const msPerBeat = 60000 / exercise.bpm;

    // Use a small initial delay to allow context to resume
    const initialDelaySec = 0.2;
    
    // Calculate total duration based on ACTUAL notes being played
    const lastNote = notesToPlay[notesToPlay.length - 1];
    const totalBeatsToPlay = lastNote ? lastNote.startBeat + lastNote.durationBeats : 0;
    const totalDurationMs = totalBeatsToPlay * msPerBeat;
    
    // Start time for playhead animation (after initial delay)
    const animationStartTime = performance.now() + (initialDelaySec * 1000);

    notesToPlay.forEach((note) => {
      const startTimeSec = (note.startBeat * msPerBeat) / 1000;
      const duration = note.durationBeats * msPerBeat;
      
      // Schedule perfectly on the Web Audio API clock
      engine.playTone(midiToFrequency(note.midi), duration, note.syllable, initialDelaySec + startTimeSec);
    });
    
    // Animate playhead using requestAnimationFrame for perfect sync
    const animatePlayhead = () => {
      const elapsed = performance.now() - animationStartTime;
      const progress = Math.max(0, Math.min(elapsed / totalDurationMs, 1));
      setPlayheadPosition(progress * 100);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animatePlayhead);
      } else {
        // Animation complete
        setIsPlaying(false);
        setPlayheadPosition(0);
        animationFrameRef.current = null;
      }
    };
    
    // Start animation immediately (it will handle the delay internally)
    animationFrameRef.current = requestAnimationFrame(animatePlayhead);

    // Auto-stop audio when finished
    const endTId = window.setTimeout(() => {
      if (engineRef.current) {
        engineRef.current.fadeOutAllTones();
      }
    }, totalDurationMs + (initialDelaySec * 1000) + 500);
    timeoutsRef.current.push(endTId);
  };

  return (
    <motion.div 
      className="min-h-full bg-sand pb-32"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
    >
      {/* Editorial Header */}
      <div className="pt-12 px-6 pb-8 relative">
        <button 
          onClick={() => { stopPreview(); onClose(); }}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-charcoal mb-10 shadow-sm border border-stone-200/50 hover:bg-stone-100 transition-colors relative z-20"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="inline-block px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-[10px] font-bold text-charcoal tracking-widest uppercase mb-6 border border-stone-200/50">
          {exercise.category}
        </div>
        
        <h1 className="text-4xl font-black text-charcoal leading-[1.1] tracking-tight mb-4">
          {exercise.name}
        </h1>
        
        <p className="text-charcoal/70 text-base font-medium leading-relaxed max-w-[90%]">
          {exercise.goal}
        </p>
      </div>

      {/* Abstract Art / Vibe Representation (Audio Preview) */}
      <div className="px-6 mb-8">
        <div className="w-full aspect-[21/9] bg-gradient-to-br from-[#e9dfce] to-[#d6c7b0] rounded-[2rem] relative overflow-hidden flex items-center justify-center border border-white/50 shadow-sm group">
           <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none">
              <div className={`absolute top-0 right-0 w-40 h-40 bg-clay rounded-full filter blur-[50px] transition-all duration-1000 ${isPlaying ? 'scale-150 animate-pulse' : 'scale-100'}`} />
              <div className={`absolute bottom-0 left-0 w-40 h-40 bg-sage rounded-full filter blur-[50px] transition-all duration-1000 ${isPlaying ? 'scale-150 animate-pulse delay-300' : 'scale-100'}`} />
           </div>

           {/* Mini Notes Visualization with Playhead */}
           <div className="absolute inset-0 p-4 pointer-events-none flex items-center justify-center">
             <div className="w-full h-full relative">
               {(() => {
                 // Show only the notes that will be played (first 12 non-chord notes)
                 const notesToShow = exercise.notes.filter(n => !n.isChord).slice(0, 12);
                 if (notesToShow.length === 0) return null;
                 
                 const allMidis = notesToShow.map(n => n.midi);
                 const minMidi = Math.min(...allMidis) - 2;
                 const maxMidi = Math.max(...allMidis) + 2;
                 const maxBeatsToShow = Math.max(...notesToShow.map(n => n.startBeat + n.durationBeats));
                 const range = Math.max(1, maxMidi - minMidi);
                 
                 return (
                   <>
                     {/* Notes */}
                     {notesToShow.map((note, i) => {
                       const left = (note.startBeat / maxBeatsToShow) * 100;
                       const width = (note.durationBeats / maxBeatsToShow) * 100;
                       const top = ((maxMidi - note.midi) / range) * 100;
                       
                       return (
                         <div 
                           key={i} 
                           className="absolute bg-white/60 rounded-full shadow-sm"
                           style={{ 
                             left: `${left}%`, 
                             width: `${Math.max(3, width)}%`, 
                             top: `${top}%`, 
                             height: '8px',
                             marginTop: '-4px'
                           }} 
                         />
                       );
                     })}
                     
                     {/* Animated Playhead - synced with audio using requestAnimationFrame */}
                     {isPlaying && (
                       <div 
                         className="absolute top-0 bottom-0 w-0.5 bg-clay shadow-lg transition-none"
                         style={{
                           left: `${playheadPosition}%`
                         }}
                       />
                     )}
                   </>
                 );
               })()}
             </div>
           </div>
           
           <button 
             onClick={startPreview}
             className="w-16 h-16 rounded-full bg-white/40 hover:bg-white/50 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer z-10"
           >
             {isPlaying ? (
               <Square size={28} className="text-white opacity-100 fill-current" />
             ) : (
               <Play size={32} className="text-white ml-1 opacity-100 fill-current" />
             )}
           </button>

           <div className="absolute bottom-3 font-bold text-white/90 uppercase tracking-widest text-xs z-10 pointer-events-none drop-shadow-md">
             {isPlaying ? 'กำลังเล่น...' : 'ฟังตัวอย่าง'}
           </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        
        {/* Organic Stats Grid */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6 snap-x">
          <div className="min-w-[130px] snap-start bg-white/60 backdrop-blur-sm p-5 rounded-[2rem] border border-stone-200/50 shadow-sm">
            <Layers className="text-taupe mb-3" size={20} />
            <div className="text-[10px] font-bold text-taupe uppercase tracking-widest mb-1">ระดับ</div>
            <div className="font-black text-xl text-charcoal capitalize">
              {exercise.difficulty === 'beginner' ? 'เริ่มต้น' : exercise.difficulty === 'intermediate' ? 'ปานกลาง' : exercise.difficulty === 'advanced' ? 'ขั้นสูง' : 'ปานกลาง'}
            </div>
          </div>
          <div className="min-w-[130px] snap-start bg-white/60 backdrop-blur-sm p-5 rounded-[2rem] border border-stone-200/50 shadow-sm">
            <Wind className="text-taupe mb-3" size={20} />
            <div className="text-[10px] font-bold text-taupe uppercase tracking-widest mb-1">ความเร็ว</div>
            <div className="font-black text-xl text-charcoal">{exercise.bpm} <span className="text-sm">BPM</span></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-stone-200/50 shadow-sm">
          <h3 className="font-bold text-lg text-charcoal flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sand-dark flex items-center justify-center text-charcoal">
              <Info size={16} />
            </div>
            คำแนะนำ
          </h3>
          <p className="text-charcoal/80 leading-relaxed font-medium">
            {exercise.instructions || "ปล่อยให้เสียงไหลออกมาอย่างเป็นธรรมชาติ ทำตามตัวนำทาง"}
          </p>
        </div>

      </div>

      {/* Floating Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-sand via-sand to-transparent z-50 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { stopPreview(); onStart(); }}
          className="w-full bg-charcoal text-white py-5 rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-charcoal/20"
        >
          <Play size={20} className="fill-current" />
          เริ่มฝึกซ้อม
        </motion.button>
      </div>
    </motion.div>
  );
}