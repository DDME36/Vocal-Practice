import { useState } from 'react';
import { IconLungs, IconMouth, IconUser, IconCheckCircle } from './Icons';

interface TheoryTopic {
  id: string;
  title: string;
  time: string;
  icon: React.ReactNode;
  desc: string;
  content: React.ReactNode;
}

export default function TheoryView() {
  const [selectedTopic, setSelectedTopic] = useState<TheoryTopic | null>(null);

  const topics: TheoryTopic[] = [
    { 
      id: 'breathing', title: 'Breathing', time: '5 MIN', icon: <IconLungs size={32} />, 
      desc: 'เรียนรู้วิธีหายใจด้วยกะบังลม (Diaphragmatic Breathing) เพื่อรองรับการร้องเพลง',
      content: (
        <>
          <h3>การหายใจด้วยกะบังลมคืออะไร?</h3>
          <p>การหายใจที่ถูกต้องสำหรับการร้องเพลงคือการใช้ <b>กะบังลม (Diaphragm)</b> ซึ่งเป็นกล้ามเนื้อที่อยู่ใต้ปอด เมื่อเราหายใจเข้า กะบังลมจะลดต่ำลง ทำให้อวัยวะในช่องท้องดันตัวออกมา (ท้องป่อง) เพื่อเปิดพื้นที่ให้ปอดขยายได้เต็มที่</p>
          <h3>วิธีฝึกหายใจ</h3>
          <ul>
            <li>เอามือวางไว้ที่หน้าท้อง (เหนือสะดือ)</li>
            <li>สูดลมหายใจเข้าลึกๆ ช้าๆ ให้รู้สึกว่าท้องดันมือออก</li>
            <li>เวลาหายใจออก ให้ค่อยๆ ปล่อยลมออก หน้าท้องจะค่อยๆ แฟบลง</li>
          </ul>
          <p><b>ข้อควรระวัง:</b> เวลาหายใจเข้า ไหล่และหน้าอกตื้นๆ ไม่ควรยกขึ้นเด็ดขาด!</p>
        </>
      )
    },
    { 
      id: 'phonation', title: 'Phonation', time: '5 MIN', icon: <IconMouth size={32} />, 
      desc: 'ทำความเข้าใจการสร้างเสียงจากเส้นเสียง และวิธีดูแลเสียงให้แข็งแรง',
      content: (
        <>
          <h3>การเกิดเสียง (Phonation)</h3>
          <p>เสียงมนุษย์เกิดจากการที่ลมหายใจจากกะบังลมพุ่งผ่าน <b>เส้นเสียง (Vocal Cords/Folds)</b> ที่อยู่ในกล่องเสียง (Larynx) ทำให้เส้นเสียงเกิดการสั่นสะเทือน</p>
          <h3>การดูแลรักษาเส้นเสียง</h3>
          <ul>
            <li><b>ดื่มน้ำมากๆ:</b> เส้นเสียงต้องการความชุ่มชื้น ควรดื่มน้ำอุณหภูมิห้อง</li>
            <li><b>วอร์มเสียงทุกครั้ง:</b> ห้ามร้องเพลงเต็มเสียงทันที ควรทำการ Lip Trill หรือ Humming ก่อนเสมอ</li>
            <li><b>พักผ่อนให้เพียงพอ:</b> เสียงที่แหบแห้งมักเกิดจากร่างกายที่เหนื่อยล้าเกินไป</li>
          </ul>
        </>
      )
    },
    { 
      id: 'resonance', title: 'Resonance', time: '5 MIN', icon: <span style={{fontSize: 28}}>🦷</span>, 
      desc: 'เรียนรู้เรื่องช่องกังวาน (Resonators) เพื่อให้เสียงพุ่งและมีพลัง',
      content: (
        <>
          <h3>ช่องกังวาน (Resonance) คืออะไร?</h3>
          <p>เปรียบเส้นเสียงเหมือนสายกีตาร์ สายลำพังไม่มีเสียงดังมากนัก ต้องอาศัย "ตัวกีตาร์" เพื่อขยายเสียง ในร่างกายเรา กล่องเสียง ลำคอ ปาก และโพรงจมูก คือช่องกังวาน (Resonators)</p>
          <h3>จุดสั่นพ้องหลักๆ</h3>
          <ul>
            <li><b>Chest Resonance (เสียงทุ้ม/อก):</b> รู้สึกสั่นที่หน้าอก ใช้สำหรับเสียงพูดและเสียงต่ำ</li>
            <li><b>Mouth/Pharyngeal (เสียงกลาง):</b> รู้สึกกังวานในช่องปากและคอ</li>
            <li><b>Sinus/Nasal (เสียงขึ้นจมูก/มาส์ก):</b> รู้สึกกังวานแถวโหนกแก้ม (The Mask) ช่วยให้เสียงแหลมพุ่งและบาดใจ</li>
          </ul>
        </>
      )
    },
    { 
      id: 'registers', title: 'Registers', time: '10 MIN', icon: <IconUser size={32} />, 
      desc: 'ทำความเข้าใจ Register ต่างๆ ของเสียง: Fry, Chest, Mixed, Head, Whistle',
      content: (
        <>
          <h3>Vocal Registers (ย่านเสียง)</h3>
          <p>เสียงมนุษย์ถูกแบ่งออกเป็นช่วงๆ (Registers) ตามลักษณะการสั่นของเส้นเสียง:</p>
          <ul>
            <li><b>Vocal Fry:</b> เสียงต่ำสุด ขาดๆ เหมือนเสียงทอดไข่ (ผ่อนคลายที่สุด)</li>
            <li><b>Chest Voice:</b> เสียงเต็มที่เราใช้พูดปกติ แข็งแรง ทุ้ม หนา</li>
            <li><b>Mixed Voice:</b> เสียงผสมระหว่าง Chest กับ Head เป็นกุญแจสำคัญในการร้องโน้ตสูงให้ดูมีพลังโดยไม่ต้องตะโกน</li>
            <li><b>Head Voice/Falsetto:</b> เสียงหลบหรือเสียงสูงเบาๆ เส้นเสียงบางลง สั่นเฉพาะขอบๆ</li>
            <li><b>Whistle Register:</b> เสียงหวีดแหลมสุดยอด (แบบ Mariah Carey หรือ Ariana Grande)</li>
          </ul>
        </>
      )
    },
    { 
      id: 'posture', title: 'Posture', time: '5 MIN', icon: <IconCheckCircle size={32} />, 
      desc: 'ท่าทางที่ถูกต้องสำหรับการร้อง: ยืน หรือ นั่ง ต้องเป็นอย่างไร',
      content: (
        <>
          <h3>การจัดสรีระร่ายกาย (Posture)</h3>
          <p>ถ้าสายยางฉีดน้ำถูกพับ น้ำก็ไหลไม่สะดวก ร่างกายและหลอดลมของเราก็เช่นกัน!</p>
          <h3>ท่ายืนร้องเพลงที่ถูกต้อง</h3>
          <ul>
            <li><b>เท้า:</b> แยกห่างกันเท่าความกว้างหัวไหล่ ให้น้ำหนักลงเต็มสองเท้า</li>
            <li><b>เข่า:</b> งอได้เล็กน้อย ห้ามล็อกเข่าตึงเด็ดขาด เพราะจะทำให้เกร็ง</li>
            <li><b>หน้าอก:</b> ยืดขึ้นเล็กน้อย (สายตาขนานพื้น) ไม่ห่อไหล่</li>
            <li><b>คอและคาง:</b> ตั้งคอตรง คางขนานพื้น <b>อย่าแหงนหน้าขึ้นเวลาร้องเสียงสูง!</b> เพราะหลอดลมจะถูกบีบ</li>
          </ul>
        </>
      )
    },
  ];

  if (selectedTopic) {
    return (
      <div className="home theory-page" style={{ minHeight: 'calc(100vh - 84px)' }}>
        <header className="home-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="cb" style={{width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setSelectedTopic(null)}>←</button>
          <h1 style={{ margin: 0 }}>{selectedTopic.title}</h1>
        </header>
        
        <div className="theory-detail-hero" style={{ padding: '40px 16px', textAlign: 'center', background: 'var(--panel)', borderRadius: 24, margin: '16px 0', border: '1px solid rgba(99,102,241,0.2)', boxShadow: 'var(--shadow)' }}>
          <div style={{ color: '#1a1a1a', marginBottom: 16, transform: 'scale(1.5)' }}>{selectedTopic.icon}</div>
          <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>{selectedTopic.time} Masterclass</div>
          <p style={{ color: 'var(--text2)', marginTop: 16, lineHeight: 1.6, fontWeight: 500 }}>{selectedTopic.desc}</p>
        </div>

        <div className="theory-detail-content" style={{ padding: '0 8px', lineHeight: 1.7, fontSize: 16, color: 'var(--text)' }}>
          {selectedTopic.content}
        </div>
        <div style={{ height: 120 }}></div>
      </div>
    );
  }

  return (
    <div className="home theory-page" style={{ minHeight: 'calc(100vh - 84px)' }}>
      <header className="home-header">
        <h1 style={{fontSize: 32}}>Masterclasses</h1>
        <p className="sub" style={{marginTop: 8}}>อัลบั้มความรู้ฉบับนักร้องอาชีพ</p>
      </header>
      
      {/* Redesigned to Masonry Grid / Album Covers */}
      <div className="theory-grid">
        {topics.map((t, i) => (
          <div key={i} className="th-grid-card" onClick={() => setSelectedTopic(t)}>
            <div className="th-icon-wrapper">
              {t.icon}
            </div>
            <div className="th-title">{t.title}</div>
            <div className="th-time">{t.time}</div>
          </div>
        ))}
      </div>
      <div style={{height: 100}}></div>
    </div>
  );
}
