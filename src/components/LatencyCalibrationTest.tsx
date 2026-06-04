import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, AlertCircle, Info, ChevronRight, X, Mic } from 'lucide-react';
import { AudioEngine } from '../lib/audioEngine';
import { 
  adjustManualOffset, 
  type LatencySettings 
} from '../lib/latencyCalibration';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  currentSettings: LatencySettings;
  onComplete: (newSettings: LatencySettings) => void;
  onCancel: () => void;
  isOnboarding?: boolean;
}

interface TestResult {
  expectedTime: number;
  detectedTime: number;
  difference: number;
}

export default function LatencyCalibrationTest({ currentSettings, onComplete, onCancel, isOnboarding }: Props) {
  const [step, setStep] = useState<'intro' | 'testing' | 'results'>('intro');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const engineRef = useRef<AudioEngine | null>(null);
  const testStartTimeRef = useRef<number>(0);
  const detectedTimeRef = useRef<number | null>(null);

  const TOTAL_TESTS = 5;
  const TEST_FREQUENCY = 440; // A4

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const startTest = async () => {
    setStep('testing');
    setCurrentTest(0);
    setTestResults([]);
    setShowErrorModal(false);
    
    // Initialize audio engine
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    
    try {
      await engineRef.current.start();
      setTimeout(() => runSingleTest(), 500); // Small delay for mic to be ready
    } catch {
      setShowErrorModal(true);
      setStep('intro');
    }
  };

  const runSingleTest = () => {
    setIsListening(false);
    detectedTimeRef.current = null;
    
    // Countdown 3, 2, 1
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
        performTest();
      }
    }, 1000);
  };

  const performTest = async () => {
    if (!engineRef.current) return;
    
    setIsListening(true);
    testStartTimeRef.current = performance.now();
    
    // Play reference tone
    await engineRef.current.playTone(TEST_FREQUENCY, 500);
    
    // Listen for user's voice
    let pitchDetected = false;
    
    const cleanup = () => {
      if (engineRef.current) {
        engineRef.current.onPitchDetected = null;
      }
    };
    
    const timeoutId = setTimeout(() => {
      if (!pitchDetected) {
        cleanup();
        setIsListening(false);
        setShowErrorModal(true);
      }
    }, 5000);
    
    engineRef.current.onPitchDetected = (freq, volume) => {
      if (pitchDetected) return;
      
      // Check if user is singing (lower threshold for better detection)
      if (volume > 0.01 && freq && Math.abs(freq - TEST_FREQUENCY) < 150) {
        pitchDetected = true;
        cleanup();
        clearTimeout(timeoutId);
        
        detectedTimeRef.current = performance.now();
        
        const expectedTime = testStartTimeRef.current;
        const detectedTime = detectedTimeRef.current;
        const difference = detectedTime - expectedTime;
        
        // Record result
        const result: TestResult = {
          expectedTime,
          detectedTime,
          difference
        };
        
        setTestResults(prev => [...prev, result]);
        setIsListening(false);
        
        // Move to next test or show results
        setTimeout(() => {
          const nextTest = currentTest + 1;
          if (nextTest < TOTAL_TESTS) {
            setCurrentTest(nextTest);
            runSingleTest();
          } else {
            showResults();
          }
        }, 1000);
      }
    };
  };

  const showResults = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setStep('results');
  };

  const calculateRecommendedOffset = (): number => {
    if (testResults.length === 0) return 0;
    
    // Calculate average latency
    const avgLatency = testResults.reduce((sum, r) => sum + r.difference, 0) / testResults.length;
    
    // Subtract current compensation to get the offset needed
    const currentCompensation = currentSettings.totalCompensation;
    const recommendedOffset = Math.round(avgLatency - currentCompensation);
    
    return recommendedOffset;
  };

  const applyRecommendedSettings = () => {
    const offset = calculateRecommendedOffset();
    let newSettings = { ...currentSettings };
    
    // Reset manual offset first
    newSettings.manualOffset = 0;
    
    // Apply new offset
    newSettings = adjustManualOffset(newSettings, offset);
    
    onComplete(newSettings);
  };

  const avgLatency = testResults.length > 0 
    ? testResults.reduce((sum, r) => sum + r.difference, 0) / testResults.length 
    : 0;

  return (
    <div className="fixed inset-0 bg-sand z-[10000] flex flex-col select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full bg-clay-light/5 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] rounded-full bg-sage-light/5 blur-[90px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5 bg-white/80 backdrop-blur-md border-b border-stone-200/50 flex justify-between items-center pt-[calc(20px+env(safe-area-inset-top,0px))]">
        <h2 className="text-xl font-black text-charcoal">
          ทดสอบระดับเสียงไมค์และดีเลย์
        </h2>
        <button
          onClick={onCancel}
          className={`cursor-pointer transition-all active:scale-95 flex items-center justify-center ${
            isOnboarding
              ? 'px-5 py-2.5 rounded-full bg-sand-dark text-taupe font-bold text-xs hover:bg-stone-200/80 border border-stone-200/30'
              : 'w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-charcoal'
          }`}
        >
          {isOnboarding ? 'ข้ามขั้นตอน' : <X size={18} />}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-sm w-full text-center flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-8 bg-gradient-to-br from-[#e9dfce] to-sand-dark rounded-[2.2rem] flex items-center justify-center text-clay-dark shadow-sm border border-white">
                <Volume2 size={36} />
              </div>

              <h3 className="text-2xl font-black text-charcoal mb-3">
                {isOnboarding ? 'ปรับค่าความล่าช้าเสียง' : 'การชดเชยดีเลย์ไมโครโฟน'}
              </h3>
              <p className="text-sm font-medium text-taupe leading-relaxed mb-8">
                เพื่อให้ระบบวิเคราะห์ระดับเสียงของคุณตรงจังหวะแบบเรียลไทม์ได้อย่างสมบูรณ์แบบ เราจำเป็นต้องวัดดีเลย์ของไมโครโฟน
              </p>
              
              <div className="w-full text-left bg-white rounded-3xl p-6 border border-stone-200/50 shadow-sm mb-8">
                <div className="text-xs font-bold uppercase tracking-widest text-clay mb-3 flex items-center gap-2">
                  <Info size={14} /> วิธีการทดสอบ:
                </div>
                <ol className="space-y-3.5 text-sm font-semibold text-charcoal/80">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-sand-dark flex items-center justify-center text-xs text-charcoal shrink-0 mt-0.5">1</span>
                    <span>เมื่อได้ยินเสียงสัญญาณให้เริ่มร้องตามทันที</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-sand-dark flex items-center justify-center text-xs text-charcoal shrink-0 mt-0.5">2</span>
                    <span>ร้องออกเสียง "อา" หรือ "อี" ล็อคเสียงให้นิ่ง</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-sand-dark flex items-center justify-center text-xs text-charcoal shrink-0 mt-0.5">3</span>
                    <span>ทำซ้ำทั้งหมด {TOTAL_TESTS} ครั้งเพื่อความแม่นยำ</span>
                  </li>
                </ol>
              </div>

              <button
                onClick={startTest}
                className="w-full bg-charcoal text-white hover:bg-clay py-5 rounded-full font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-charcoal/10 hover:shadow-clay/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                เริ่มทดสอบดีเลย์ <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: TESTING PROGRESS */}
          {step === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="max-w-xs w-full text-center flex flex-col items-center"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-taupe mb-6">
                บทวิเคราะห์ดีเลย์ ครั้งที่ {currentTest + 1} จาก {TOTAL_TESTS}
              </div>

              <div className="w-56 h-56 mx-auto mb-10 flex items-center justify-center relative">
                {/* Decorative pulse ring when listening */}
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-clay-light/20 border-2 border-clay/40 animate-ping" />
                )}

                <div className={`w-48 h-48 rounded-full border-4 flex items-center justify-center text-6xl font-black transition-all shadow-xl z-10 ${
                  isListening 
                    ? 'bg-gradient-to-br from-clay to-clay-light border-white text-white' 
                    : countdown !== null 
                    ? 'bg-white border-clay text-clay' 
                    : 'bg-white border-stone-200 text-taupe'
                }`}>
                  {countdown !== null ? (
                    countdown
                  ) : isListening ? (
                    <Mic size={56} className="animate-pulse" />
                  ) : (
                    <Volume2 size={56} />
                  )}
                </div>
              </div>

              <div className="text-lg font-black text-charcoal mb-8 h-8">
                {countdown !== null && 'เตรียมตัว...'}
                {countdown === null && !isListening && 'กำลังเล่นเสียงอ้างอิง...'}
                {isListening && 'กรุณาร้องออกเสียงตามตัวโน้ต!'}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-sand-dark rounded-full overflow-hidden border border-stone-200/30">
                <div 
                  className="h-full bg-clay transition-all duration-300 ease-out"
                  style={{ width: `${((currentTest) / TOTAL_TESTS) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESULTS REPORT */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full flex flex-col"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-sage-light to-sage-dark rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-sage/20 border-2 border-white">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-charcoal mb-2">
                  วิเคราะห์ผลทดสอบเสร็จสมบูรณ์!
                </h3>
                <p className="text-sm font-medium text-taupe">
                  ระบบได้กำหนดค่าความล่าช้าชดเชยที่สมบูรณ์แบบให้กับคุณแล้ว
                </p>
              </div>

              {/* Bento Grid Results Card */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200/50 shadow-sm mb-5 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                  <span className="text-sm font-bold text-taupe uppercase tracking-wider">
                    ดีเลย์ไมโครโฟนเฉลี่ย
                  </span>
                  <span className="text-3xl font-black text-clay">
                    {Math.round(avgLatency)}ms
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-taupe">ค่าชดเชยดีเลย์ของเดิม</span>
                  <span className="text-charcoal">{currentSettings.totalCompensation}ms</span>
                </div>

                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-taupe">ชดเชยใหม่แนะนำ (ชดเชยจริง)</span>
                  <span className="text-sage-dark bg-sage-light/20 px-3 py-1 rounded-full text-xs font-bold">
                    {currentSettings.totalCompensation + calculateRecommendedOffset()}ms 
                    ({calculateRecommendedOffset() > 0 ? '+' : ''}{calculateRecommendedOffset()}ms)
                  </span>
                </div>
              </div>

              {/* Individual list details */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200/50 shadow-sm mb-5">
                <div className="text-xs font-bold uppercase tracking-widest text-charcoal mb-3">
                  ผลลัพธ์การวัดทั้ง {TOTAL_TESTS} ครั้ง
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="bg-sand p-2.5 rounded-xl border border-stone-200/30 text-center flex flex-col justify-center gap-1">
                      <div className="text-[10px] font-bold text-taupe">ครั้งที่ {index + 1}</div>
                      <div className="text-sm font-black text-charcoal">{Math.round(result.difference)}ms</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info caution for large offset */}
              {Math.abs(calculateRecommendedOffset()) > 20 && (
                <div className="bg-ochre-light/10 border border-ochre/30 rounded-2.5xl p-4 mb-6 flex gap-3 text-left">
                  <AlertCircle size={20} className="text-ochre shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold text-ochre-dark leading-relaxed">
                    ระบบพบดีเลย์ที่แกว่งมากกว่าเกณฑ์ปกติเล็กน้อย แนะนำให้กดใช้ค่าที่ประมวลผลแนะนำนี้เพื่อให้การวิเคราะห์ตรงท่อนโน้ตพอดี
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4.5 bg-white border border-stone-200 font-bold text-charcoal rounded-full active:scale-95 transition-all cursor-pointer text-center text-sm"
                >
                  {isOnboarding ? 'ข้ามขั้นตอนนี้' : 'ยกเลิก'}
                </button>
                <button
                  onClick={applyRecommendedSettings}
                  className="flex-[2] py-4.5 bg-charcoal text-white hover:bg-clay font-black rounded-full shadow-lg shadow-charcoal/10 hover:shadow-clay/20 active:scale-95 transition-all cursor-pointer text-center text-sm"
                >
                  {isOnboarding ? 'ใช้ค่านี้ & เริ่มต้นใช้งาน' : 'ยอมรับและบันทึกค่าชดเชย'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Error / Noise warning Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 mb-5 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              
              <h3 className="text-xl font-black text-charcoal mb-2">
                {step === 'intro' ? 'ไม่สามารถเชื่อมไมโครโฟน' : 'ตรวจหาเสียงสัญญาณไม่พบ'}
              </h3>
              
              <p className="text-sm font-medium text-taupe leading-relaxed mb-6">
                {step === 'intro' 
                  ? 'กรุณาอนุญาตการเข้าใช้งานสิทธิ์ไมโครโฟนในเบราว์เซอร์ของท่านแล้วกดลองใหม่อีกครั้ง'
                  : 'กรุณาร้องออกเสียง "อา" หรือ "อี" ให้ชัดเจนขึ้นและเข้ามาใกล้ๆ ไมโครโฟนอุปกรณ์'
                }
              </p>
              
              <div className="flex gap-3 w-full">
                {step === 'testing' && (
                  <button
                    onClick={() => {
                      setShowErrorModal(false);
                      runSingleTest();
                    }}
                    className="flex-1 py-3 bg-clay text-white font-bold rounded-2xl active:scale-95 shadow-md shadow-clay/10 transition-all cursor-pointer text-sm"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    if (step !== 'intro') {
                      if (engineRef.current) {
                        engineRef.current.stop();
                        engineRef.current = null;
                      }
                      setStep('intro');
                    }
                  }}
                  className="flex-1 py-3 bg-stone-100 font-bold text-charcoal rounded-2xl active:scale-95 hover:bg-stone-200 transition-colors cursor-pointer text-sm"
                >
                  {step === 'intro' ? 'ตกลง' : 'ยกเลิก'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
