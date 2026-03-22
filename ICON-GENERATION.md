# Icon Generation Guide

## วิธีสร้าง PNG Icons จาก SVG

### Option 1: ใช้ Online Tool (แนะนำ - ง่ายที่สุด)
1. ไปที่ https://realfavicongenerator.net/
2. Upload `public/icon.svg`
3. Generate icons ทุกขนาด
4. Download และแทนที่ไฟล์ใน `/public/`

### Option 2: ใช้ Cloudconvert
1. ไปที่ https://cloudconvert.com/svg-to-png
2. Upload `public/icon.svg`
3. ตั้งค่า:
   - Width: 192px → Save as `icon-192.png`
   - Width: 512px → Save as `icon-512.png`
4. Download และแทนที่ไฟล์ใน `/public/`

### Option 3: ใช้ Command Line (ถ้ามี ImageMagick)
```bash
# Install ImageMagick first
# Windows: choco install imagemagick
# Mac: brew install imagemagick

# Generate icons
magick convert -background none -resize 192x192 public/icon.svg public/icon-192.png
magick convert -background none -resize 512x512 public/icon.svg public/icon-512.png
```

### Option 4: ใช้ Figma/Canva
1. Import `public/icon.svg` เข้า Figma/Canva
2. Export เป็น PNG:
   - 192x192px → `icon-192.png`
   - 512x512px → `icon-512.png`
3. แทนที่ไฟล์ใน `/public/`

## ตรวจสอบ Icons
หลังจากสร้างเสร็จ ให้ตรวจสอบว่า:
- ✅ `icon-192.png` มีขนาด 192x192px
- ✅ `icon-512.png` มีขนาด 512x512px
- ✅ Background โปร่งใส (transparent) หรือมี gradient
- ✅ Icon ชัดเจน ไม่เบลอ

## หมายเหตุ
ตอนนี้ใช้ placeholder icons อยู่ (1x1 pixel)
หลังจากแทนที่ด้วย icons จริงแล้ว ให้:
1. `git add public/icon-192.png public/icon-512.png`
2. `git commit -m "Update: เพิ่ม PWA icons จริง"`
3. `git push`
4. Redeploy บน Vercel
