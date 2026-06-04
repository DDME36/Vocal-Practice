import { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Zap, ArrowLeft, Mic, Target, Flame, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import type { VocalRange } from '../lib/types';
import { 
  loadLatencySettings, 
  saveLatencySettings, 
  adjustManualOffset,
  resetToDefault,
  type LatencySettings 
} from '../lib/latencyCalibration';
import LatencyCalibrationTest from './LatencyCalibrationTest';
import VocalRangeView from './VocalRangeView';
import { useSettingsStore } from '../stores/useSettingsStore';

interface Props { 
  vocalRange: VocalRange | null; 
  onClose: () => void;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  onChangeSkillLevel?: () => void;
}

export default function SettingsView({ vocalRange, onClose, skillLevel, onChangeSkillLevel }: Props) {
  const vt = vocalRange ? vocalRange.voiceType : 'ยังไม่ได้ตั้งค่า';
  
  const [dailyGoal, setDailyGoal] = useState(() => localStorage.getItem('setting_dailyGoal') || '10');
  const [latencySettings, setLatencySettings] = useState<LatencySettings>(loadLatencySettings());
  const [showLatencyDetails, setShowLatencyDetails] = useState(false);
  const [showLatencyTest, setShowLatencyTest] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showVocalRangeTest, setShowVocalRangeTest] = useState(false);

  useEffect(() => {
    localStorage.setItem('setting_dailyGoal', dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    saveLatencySettings(latencySettings);
  }, [latencySettings]);

  const cycleDailyGoal = () => {
    const goals = ['5', '10', '15', '20', '30'];
    const nextIdx = (goals.indexOf(dailyGoal) + 1) % goals.length;
    setDailyGoal(goals[nextIdx]);
  };

  const handleLatencyAdjust = (delta: number) => {
    setLatencySettings(prev => adjustManualOffset(prev, delta));
  };

  const handleLatencyReset = () => {
    setLatencySettings(resetToDefault());
  };

  const handleLatencyTestComplete = (newSettings: LatencySettings) => {
    setLatencySettings(newSettings);
    setShowLatencyTest(false);
  };

  const executeReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {showVocalRangeTest && (
        <VocalRangeView
          onBack={() => setShowVocalRangeTest(false)}
          onSave={(range) => {
            useSettingsStore.getState().setVocalRange(range);
            setShowVocalRangeTest(false);
          }}
        />
      )}

      {showLatencyTest && (
        <LatencyCalibrationTest
          currentSettings={latencySettings}
          onComplete={handleLatencyTestComplete}
          onCancel={() => setShowLatencyTest(false)}
        />
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-charcoal/40 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-black text-charcoal mb-2">ยืนยันการล้างข้อมูล?</h3>
            <p className="text-charcoal/70 font-medium mb-6 leading-relaxed">
              การกระทำนี้จะลบข้อมูลช่วงเสียง, ระดับความสามารถ, และสถิติการฝึกทั้งหมดของคุณ โดย<strong className="text-rose-500">ไม่สามารถกู้คืนได้</strong>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-stone-100 font-bold text-charcoal rounded-xl hover:bg-stone-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={executeReset}
                className="flex-1 py-3 bg-rose-500 font-bold text-white rounded-xl hover:bg-rose-600 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
              >
                ล้างข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-sand text-charcoal overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-300 pb-32">
        <header className="sticky top-0 z-10 flex justify-between items-center p-6 bg-white/80 backdrop-blur-md border-b border-stone-200/50">
          <h1 className="text-2xl font-black text-charcoal">ตั้งค่า</h1>
          <button 
            className="w-12 h-12 rounded-full bg-sand-dark flex items-center justify-center text-charcoal hover:bg-stone-200 transition-colors" 
            onClick={onClose}
          >
            <ArrowLeft size={20} />
          </button>
        </header>

        <div className="px-6 py-6 space-y-6">
          
          {/* ข้อมูลโปรไฟล์ */}
          <div className="bg-white rounded-3xl border border-stone-200/50 overflow-hidden shadow-sm">
            <div 
              className="flex items-center justify-between p-5 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
              onClick={() => setShowVocalRangeTest(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-light/30 text-sage-dark flex items-center justify-center">
                  <Mic size={20} />
                </div>
                <div className="font-bold text-charcoal">ช่วงเสียง</div>
              </div>
              <div className="flex items-center gap-2 font-bold text-clay">
                {vt}
                <ChevronRight size={16} className="text-taupe" />
              </div>
            </div>

            {skillLevel && onChangeSkillLevel && (
              <div 
                className="flex items-center justify-between p-5 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                onClick={onChangeSkillLevel}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-ochre-light/30 text-ochre-dark flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div className="font-bold text-charcoal">ระดับความสามารถ</div>
                </div>
                <div className="flex items-center gap-2 font-bold text-clay">
                  {skillLevel === 'beginner' && 'เริ่มต้น'}
                  {skillLevel === 'intermediate' && 'ปานกลาง'}
                  {skillLevel === 'advanced' && 'ขั้นสูง'}
                  <ChevronRight size={16} className="text-taupe" />
                </div>
              </div>
            )}

            <div 
              className="flex items-center justify-between p-5 hover:bg-stone-50 cursor-pointer transition-colors"
              onClick={cycleDailyGoal}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-clay-light/20 text-clay-dark flex items-center justify-center">
                  <Flame size={20} />
                </div>
                <div className="font-bold text-charcoal">เป้าหมายรายวัน</div>
              </div>
              <div className="font-bold text-clay">{dailyGoal} บทฝึก</div>
            </div>
          </div>

          {/* การชดเชยความล่าช้าเสียง */}
          <div className="bg-white rounded-3xl border border-stone-200/50 overflow-hidden shadow-sm">
            <div 
              className="flex items-center justify-between p-5 hover:bg-stone-50 cursor-pointer transition-colors"
              onClick={() => setShowLatencyDetails(!showLatencyDetails)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 text-charcoal flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <div className="font-bold text-charcoal">ชดเชยความล่าช้าเสียง</div>
                  <div className="text-xs font-medium text-taupe mt-1">ปรับถ้ารู้สึกว่าเสียงไมค์ไม่ตรงจังหวะ</div>
                </div>
              </div>
              <div className="flex items-center gap-2 font-bold text-clay">
                {latencySettings.totalCompensation}ms
                {showLatencyDetails ? <ChevronDown size={16} className="text-taupe" /> : <ChevronRight size={16} className="text-taupe" />}
              </div>
            </div>

            {showLatencyDetails && (
              <div className="p-6 bg-sand-dark border-t border-stone-200/50">
                <button
                  onClick={() => setShowLatencyTest(true)}
                  className="w-full py-4 bg-clay text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-clay/20 active:scale-95 transition-all mb-6"
                >
                  <Zap size={20} />
                  ทดสอบอัตโนมัติ (แนะนำ)
                </button>

                <div className="text-center text-sm font-bold text-taupe mb-4">หรือปรับด้วยตัวเอง</div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200/50 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-charcoal">ปรับเพิ่มเติม</span>
                    <span className="font-bold text-clay text-lg">
                      {latencySettings.manualOffset > 0 ? '+' : ''}{latencySettings.manualOffset}ms
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => handleLatencyAdjust(-10)} className="flex-1 py-3 bg-sand font-bold text-charcoal rounded-xl border border-stone-200/50 active:scale-95 transition-all">-10</button>
                    <button onClick={() => handleLatencyAdjust(-1)} className="flex-1 py-3 bg-sand font-bold text-charcoal rounded-xl border border-stone-200/50 active:scale-95 transition-all">-1</button>
                    <button onClick={() => handleLatencyAdjust(1)} className="flex-1 py-3 bg-sand font-bold text-charcoal rounded-xl border border-stone-200/50 active:scale-95 transition-all">+1</button>
                    <button onClick={() => handleLatencyAdjust(10)} className="flex-1 py-3 bg-sand font-bold text-charcoal rounded-xl border border-stone-200/50 active:scale-95 transition-all">+10</button>
                  </div>

                  <button
                    onClick={handleLatencyReset}
                    className="w-full py-3 bg-stone-100 font-bold text-charcoal rounded-xl flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
                  >
                    <RotateCcw size={16} />
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </button>
                </div>

                <div className="p-4 bg-sage-light/20 rounded-2xl border border-sage-light/30">
                  <div className="text-xs font-medium text-charcoal/80 leading-relaxed">
                    <strong className="text-sage-dark block mb-1">วิธีใช้:</strong>
                    • ถ้ารู้สึกว่าเส้นเสียงของคุณวาด <strong className="text-charcoal">"ช้ากว่า"</strong> ให้เพิ่มค่า (+)<br/>
                    • ถ้ารู้สึกว่าเส้นเสียงของคุณวาด <strong className="text-charcoal">"เร็วกว่า"</strong> ให้ลดค่า (-)<br/>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* อันตราย */}
          <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-sm">
            <div 
              className="flex items-center gap-4 p-5 hover:bg-rose-50 cursor-pointer transition-colors"
              onClick={() => setShowResetConfirm(true)}
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div className="font-bold text-rose-500">ล้างข้อมูลและรีเซ็ตแอปทั้งหมด</div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
