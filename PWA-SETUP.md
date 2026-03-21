# PWA Setup Guide

## ✅ PWA Features Enabled

- ✅ Offline support with Service Worker
- ✅ Install prompt on all platforms
- ✅ App-like experience (standalone mode)
- ✅ Auto-update when new version available
- ✅ Cache fonts and assets
- ✅ iOS Safari support
- ✅ Android Chrome support
- ✅ Desktop support (Chrome, Edge, Safari)

## 📱 How to Install

### iOS (Safari)
1. เปิดเว็บใน Safari
2. กด Share button (ปุ่มแชร์)
3. เลือก "Add to Home Screen"
4. กด "Add"

### Android (Chrome)
1. เปิดเว็บใน Chrome
2. กด Menu (⋮)
3. เลือก "Install app" หรือ "Add to Home screen"
4. กด "Install"

### Desktop (Chrome/Edge)
1. เปิดเว็บใน Chrome หรือ Edge
2. มองหา install icon (➕) ใน address bar
3. กด "Install"

## 🎨 Icons

ตอนนี้ใช้ placeholder icons อยู่ ควรแทนที่ด้วย icons จริงๆ:

1. สร้าง icon 512x512px ด้วย design tool (Figma, Canva, etc.)
2. Export เป็น PNG
3. ใช้ online tool เช่น https://realfavicongenerator.net/ สร้าง icons ทุกขนาด
4. แทนที่ไฟล์ใน `/public/`:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `icon.svg` (vector)

## 🚀 Build & Deploy

```bash
npm run build
```

PWA จะทำงานเฉพาะใน production build เท่านั้น (ไม่ทำงานใน dev mode)

## 🔧 Configuration

แก้ไข PWA settings ได้ที่ `vite.config.ts`
