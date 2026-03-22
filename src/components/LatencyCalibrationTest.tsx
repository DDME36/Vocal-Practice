import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, AlertCircle } from 'lucide-react';
import { AudioEngine } from '../lib/audioEngine';
import { 
  adjustManualOffset, 
  type LatencySettings 
} from '../lib/latencyCalibration';

interface Props {
  currentSettings: LatencySettings;
  onComplete: (newSettings: LatencySettings) => void;
  onCancel: () => void;
}

interface TestResult {
  expectedTime: number;
  detectedTime: number;
  difference: number;
}

export default function LatencyCalibrationTest({ currentSettings, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<'intro' | 'testing' | 'results'>('intro');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
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
    
    // Initialize audio engine
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    
    try {
      await engineRef.current.start();
      runSingleTest();
    } catch (error) {
      alert('ไม่สามารถเข้าถึงไมค์ได้ กรุณาอนุญาตการใช้งานไมค์');
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
    
    engineRef.current.onPitchDetected = (freq, volume) => {
      if (pitchDetected) return;
      
      // Check if user is singing (volume threshold and frequency close to target)
      if (volume > 0.02 && freq && Math.abs(freq - TEST_FREQUENCY) < 100) {
        pitchDetected = true;
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
          if (currentTest + 1 < TOTAL_TESTS) {
            setCurrentTest(prev => prev + 1);
            runSingleTest();
          } else {
            showResults();
          }
        }, 1000);
      }
    };
    
    // Timeout after 3 seconds
    setTimeout(() => {
      if (!pitchDetected) {
        setIsListening(false);
        alert('ไม่ตรวจพบเสียงของคุณ กรุณาลองอีกครั้ง');
        runSingleTest();
      }
    }, 3000);
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#fafbfc',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.3s ease'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(199, 210, 254, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(252, 231, 243, 0.08) 0%, transparent 50%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
          ทดสอบความล่าช้าเสียง
        </h2>
        <button
          onClick={onCancel}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {step === 'intro' && (
          <div style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{
              width: 100,
              height: 100,
              margin: '0 auto 30px',
              background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
              borderRadius: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Volume2 size={48} />
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
              วิธีการทดสอบ
            </h3>
            
            <div style={{
              textAlign: 'left',
              background: 'white',
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--border)',
              marginBottom: 30
            }}>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: 'var(--text2)' }}>
                <li>เมื่อได้ยินเสียง "บี๊บ" ให้ร้องตาม</li>
                <li>ร้องเสียง "อา" หรือ "อี" ตามเสียงที่ได้ยิน</li>
                <li>ทำซ้ำ {TOTAL_TESTS} ครั้ง</li>
                <li>ระบบจะคำนวณค่าที่เหมาะสมให้</li>
              </ol>
            </div>

            <button
              onClick={startTest}
              style={{
                width: '100%',
                padding: 16,
                background: '#a78bfa',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(167, 139, 250, 0.3)'
              }}
            >
              เริ่มทดสอบ
            </button>
          </div>
        )}

        {step === 'testing' && (
          <div style={{ maxWidth: 400, textAlign: 'center', width: '100%' }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text2)',
              marginBottom: 20
            }}>
              ครั้งที่ {currentTest + 1} / {TOTAL_TESTS}
            </div>

            {countdown !== null ? (
              <div style={{
                width: 200,
                height: 200,
                margin: '0 auto',
                background: 'white',
                borderRadius: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 80,
                fontWeight: 900,
                color: '#a78bfa',
                border: '4px solid var(--border)',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)'
              }}>
                {countdown}
              </div>
            ) : (
              <div style={{
                width: 200,
                height: 200,
                margin: '0 auto',
                background: isListening ? 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)' : 'white',
                borderRadius: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid var(--border)',
                boxShadow: isListening ? '0 0 40px rgba(167, 139, 250, 0.5)' : '0 8px 24px rgba(15, 23, 42, 0.1)',
                animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none',
                color: isListening ? 'white' : '#a78bfa'
              }}>
                <Volume2 size={80} />
              </div>
            )}

            <div style={{
              marginTop: 30,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)'
            }}>
              {countdown !== null && 'เตรียมตัว...'}
              {countdown === null && !isListening && 'กำลังเล่นเสียง...'}
              {isListening && 'ร้องตามเสียงที่ได้ยิน!'}
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: 8,
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              marginTop: 30,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentTest + 1) / TOTAL_TESTS) * 100}%`,
                height: '100%',
                background: '#a78bfa',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {step === 'results' && (
          <div style={{ maxWidth: 500, width: '100%' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: 30
            }}>
              <div style={{
                width: 80,
                height: 80,
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                borderRadius: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <CheckCircle size={40} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                ทดสอบเสร็จสิ้น!
              </h3>
              <p style={{ color: 'var(--text2)', margin: 0 }}>
                ระบบวิเคราะห์ความล่าช้าของคุณแล้ว
              </p>
            </div>

            {/* Results */}
            <div style={{
              background: 'white',
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--border)',
              marginBottom: 20
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
                  ความล่าช้าเฉลี่ย
                </span>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#a78bfa' }}>
                  {Math.round(avgLatency)}ms
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
                  ค่าชดเชยปัจจุบัน
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {currentSettings.totalCompensation}ms
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
                  ค่าที่แนะนำ
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                  {currentSettings.totalCompensation + calculateRecommendedOffset()}ms
                  <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>
                    ({calculateRecommendedOffset() > 0 ? '+' : ''}{calculateRecommendedOffset()}ms)
                  </span>
                </span>
              </div>
            </div>

            {/* Individual results */}
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--border)',
              marginBottom: 20
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                ผลการทดสอบแต่ละครั้ง
              </div>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: index < testResults.length - 1 ? '1px solid var(--border-light)' : 'none'
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                    ครั้งที่ {index + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {Math.round(result.difference)}ms
                  </span>
                </div>
              ))}
            </div>

            {/* Info box */}
            {Math.abs(calculateRecommendedOffset()) > 20 && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                gap: 12
              }}>
                <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  ระบบตรวจพบความล่าช้าที่แตกต่างจากค่าปัจจุบัน แนะนำให้ใช้ค่าที่แนะนำเพื่อความแม่นยำที่ดีขึ้น
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: 16,
                  background: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text2)',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={applyRecommendedSettings}
                style={{
                  flex: 2,
                  padding: 16,
                  background: '#a78bfa',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(167, 139, 250, 0.3)'
                }}
              >
                ใช้ค่าที่แนะนำ
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
