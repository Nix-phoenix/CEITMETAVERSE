# Deploy Frontend to Render (Static Site)

สรุป: รีโปนี้มี `render.yaml` แล้ว โดยตั้งค่า static service ให้ใช้โฟลเดอร์ `WebPage` เป็น `staticPublishPath` — ดังนั้นการ deploy บน Render ทำได้โดยการเชื่อมต่อรีโปกับ Render ให้ใช้ `render.yaml` ที่มีอยู่

ขั้นตอนสั้น ๆ (ทำตามนี้):

1. ตรวจสอบ `render.yaml` ใน root ของโปรเจค — ค่าปัจจุบันสำคัญ:
   - `type: static`
   - `staticPublishPath: WebPage`
   - `buildCommand: echo "No build step for static frontend"` (โอเคสำหรับ static HTML/JS/CSS แบบไม่ต้อง build)

2. ปรับค่าในโค้ด frontend (ถ้าจำเป็น)
   - ถ้า `api-config.js` หรือไฟล์อื่นๆ ชี้ไปที่ `localhost`, เปลี่ยนเป็นใช้ URL ของ backend บน Render หรือ environment variable ที่จะตั้งใน Render (เช่น `RENDER_BACKEND_URL`).
   - ตัวอย่าง: ใน `WebPage/api-config.js` ให้ใส่ `const API_BASE = process.env.API_BASE || 'https://<your-backend>.onrender.com'` (ถ้าต้องการ runtime substitution ให้ใช้ฝั่ง server หรือ build-time replacement).

3. อัปโหลด (push) ทุกการเปลี่ยนแปลงไปยัง Git remote (GitHub/GitLab/Bitbucket) ที่จะเชื่อมกับ Render.

4. บน Render (https://dashboard.render.com):
   - สร้าง New -> Web Service หรือ Static Site -> เลือก Git provider -> เลือกรีโปนี้
   - Render จะอ่าน `render.yaml` และสร้าง 2 services (static frontend + backend) ตามที่กำหนด
   - ในหน้าการตั้งค่าของแต่ละ service ให้ตรวจสอบ Environment Variables ที่จำเป็น:
     - backend (web service): `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `ALLOWED_ORIGIN` เป็นต้น (ค่าใน `.env` ของคุณไม่ควรคอมมิตไปยังรีโป)
     - static (static site): ถ้าต้องการใส่ `ALLOWED_ORIGIN` หรือตัวแปรอื่นๆ ให้เพิ่มที่นี่

5. Trigger deploy (Manual deploy หรือ push ใหม่) — Render sẽ ใช้ `staticPublishPath: WebPage` และ deploy เนื้อหาใน `WebPage` เป็น static site.

ทดสอบ Locally ก่อน push (ตัวอย่าง):

Python (ง่ายที่สุด):
```bash
cd WebPage
python -m http.server 8000
# เปิด http://localhost:8000
```

หรือใช้ `npx serve`:
```bash
npm install -g serve
cd WebPage
serve -l 5000
```

Troubleshooting สั้น ๆ:
- ถ้าไฟล์หน้าเว็บโหลดไม่ครบ ให้เช็ค path ของไฟล์สไตล์/สคริปต์ (relative vs absolute)
- ถ้าเรียก API แล้วโดน CORS: ตรวจสอบ `ALLOWED_ORIGIN` ของ backend บน Render ว่าตั้งเป็น URL ของ static site (เช่น `https://<your-frontend>.onrender.com`)
- ถ้า backend ยังใช้ค่า `DATABASE_URL` จาก local ให้ตั้งค่า connection string ที่ถูกต้องใน Render (Secret) และไม่คอมมิต `.env`

ถ้าต้องการ ผมทำต่อให้ได้ดังนี้:
- แก้ `api-config.js` ให้ใช้ environment variable แบบปลอดภัย และ commit
- เพิ่ม GitHub Action เพื่อรัน build/tests ก่อน push (ถ้าต้องการ)
- ช่วยแนะนำค่ `ALLOWED_ORIGIN` ที่เหมาะสม สำหรับ CORS

บอกผมว่าจะให้ผมทำขั้นตอนถัดไปอันไหน (เช่น แก้ `api-config.js` และ commit) แล้วผมจะลงมือทำให้ครับ
