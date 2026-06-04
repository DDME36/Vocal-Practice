import { motion } from 'motion/react';
import { Trophy, Sparkles } from 'lucide-react';

interface Props {
  currentLevel: 'beginner' | 'intermediate';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LevelUpModal({ currentLevel, onConfirm, onCancel }: Props) {
  const newLevel = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
  const levelText = {
    intermediate: 'ปานกลาง',
    advanced: 'ขั้นสูง'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="w-20 h-20 bg-gradient-to-br from-clay to-ochre-dark rounded-full flex items-center justify-center shadow-xl"
            >
              <Trophy size={40} className="text-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles size={24} className="text-clay" />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-center text-charcoal mb-3 flex items-center justify-center gap-2">
          <Sparkles size={28} className="text-clay" /> ยินดีด้วย!
        </h2>

        {/* Message */}
        <p className="text-center text-charcoal/80 font-medium mb-8 text-lg leading-relaxed">
          คุณพร้อมที่จะเลื่อนระดับเป็น{' '}
          <span className="font-black text-clay">"{levelText[newLevel]}"</span>{' '}
          แล้ว!
          <br />
          <span className="text-base text-taupe mt-2 block">
            ต้องการเลื่อนระดับตอนนี้ไหม?
          </span>
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-clay text-white font-bold py-4 rounded-full shadow-xl shadow-clay/20 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
          >
            เลื่อนระดับเลย! <Sparkles size={20} className="animate-pulse" />
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-stone-100 text-charcoal font-bold py-4 rounded-full active:scale-[0.98] transition-all"
          >
            ไว้ทีหลัง
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
