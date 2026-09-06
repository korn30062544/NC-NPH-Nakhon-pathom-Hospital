# สรุปการแก้ไข (Fixes Applied)

## 1. สาเหตุหลักที่ระบบ "ประมวลผลไม่ได้" / AI ไม่ทำงาน — แก้แล้ว ✅

**ไฟล์:** `server.ts`

โค้ดเดิมมีบรรทัดนี้:
```ts
import geminiHandler from "./api/gemini";
```
แต่ในโปรเจกต์ **ไม่มีไฟล์ `api/gemini.ts` อยู่จริงเลย** — เป็น import ที่ชี้ไปยังไฟล์ที่ไม่มีอยู่

ผลกระทบ: เมื่อรัน `npm run dev` (หรือตอน build ขึ้น Vercel ที่มีขั้นตอน `esbuild server.ts --bundle ...`)
โปรแกรมจะ**พังทันทีตั้งแต่ยังไม่เริ่มทำงาน** เพราะ module resolution ล้มเหลว ทำให้:
- API ทุกเส้นทาง (`/api/health`, `/api/ai/chat`, `/api/ai/analyze-data`, `/api/sheets/fetch-csv`, `/api/generate`) ใช้งานไม่ได้ทั้งหมด ไม่ใช่แค่ AI
- บน Vercel: ขั้นตอน build ล้มเหลวทั้งชุด ทำให้เว็บที่ deploy ออกมาเป็นหน้าเปล่า (เหมือนที่เจอตอนแรก — เห็นแค่ meta tag ไม่มีแอปจริง)

**วิธีแก้:**
- สร้างไฟล์ `api/_lib/gemini.ts` และ `api/_lib/handlers.ts` เก็บ logic การเรียก Gemini AI ทั้งหมดไว้ที่เดียว (ของเดิมกระจาย/ขาดหาย)
- สร้างไฟล์ endpoint จริงในโฟลเดอร์ `api/` ตามรูปแบบที่ **Vercel Serverless Functions** ต้องการ:
  - `api/health.ts`
  - `api/generate.ts`
  - `api/gemini.ts` ← ไฟล์ที่หายไปเดิม สร้างใหม่ให้เป็น passthrough endpoint ทั่วไป (รับ `{ model?, contents, config? }` ส่งข้อความตอบกลับ) เนื่องจากไม่มีต้นฉบับเดิมให้ดูว่าทำอะไรแน่ๆ
  - `api/ai/chat.ts`
  - `api/ai/analyze-data.ts`
  - `api/ai/classify-incidents.ts`
  - `api/sheets/fetch-csv.ts`
- แก้ `server.ts` ให้ import จาก `api/_lib/handlers.ts` แทน (ใช้สำหรับรันทดสอบในเครื่องตัวเองผ่าน `npm run dev` เท่านั้น — Vercel ไม่ได้รันไฟล์นี้)

## 2. สถาปัตยกรรมไม่เข้ากับ Vercel — แก้แล้ว ✅

โค้ดเดิมพยายาม build เป็น Express server ตัวเดียว (`node dist/server.cjs`) ซึ่ง**ใช้ไม่ได้กับการ deploy บน Vercel** (Vercel รันเป็น serverless functions แยกไฟล์ ไม่ใช่ long-running Node server)

**วิธีแก้:**
- แยก API แต่ละเส้นทางเป็นไฟล์ในโฟลเดอร์ `api/` ตามข้อ 1 — Vercel จะ detect และ deploy เป็น serverless function ให้อัตโนมัติ ไม่ต้องตั้งค่าเพิ่ม
- แก้ `package.json`: `"build": "vite build"` (ตัดขั้นตอน esbuild bundle server.ts ที่ไม่จำเป็นและเป็นตัวทำให้ build fail ออก)
- แก้ `vercel.json` ให้ระบุ framework ชัดเจน (`vite`, `outputDirectory: dist`) แทน rewrite rule เดิมที่ไม่มีผลอะไร

## 3. ช่องโหว่ความปลอดภัยใน Firestore Rules — แก้แล้ว ✅

**ไฟล์:** `firestore.rules`

พบเงื่อนไข `isSignedIn() || true` ในกฎการ create/update/delete ของ collection `incidents`
— เนื่องจาก `x || true` จะเป็น `true` เสมอไม่ว่า `isSignedIn()` จะเป็นอะไร **เท่ากับว่าใครก็ได้ (ไม่ต้อง login) เพิ่ม/แก้ไข/ลบรายงานอุบัติการณ์ได้หมด**
และ collection `dataSources`/`dashboardAggregates` บางส่วนก็ไม่มีการเช็คสิทธิ์เลยในการ create/update/delete

**วิธีแก้:** เปลี่ยนเป็น `isSignedIn()` ตรงๆ (ต้อง login ก่อนถึงจะเขียน/ลบข้อมูลได้) ในทุก collection

## 4. Firebase Auth + Firestore Persistence — แก้แล้ว ✅ (รอบนี้)

เชื่อมข้อมูลเข้ากับ Firebase จริงตามที่ให้ config/schema/rules มา:

- **`src/firebase.ts`** — เริ่มต้น Firebase app (Auth + Firestore) จาก environment variables (ดู `.env.example` ที่เติมค่าจาก `firebase-applet-config.json` ให้แล้ว รวมถึง Firestore database ID แบบตั้งชื่อเองที่โปรเจกต์นี้ใช้)
- **`src/services/authService.ts`**, **`usersService.ts`**, **`dataSourcesService.ts`** — สมัคร/ล็อกอิน/ล็อกเอาต์จริง, บันทึกโปรไฟล์ผู้ใช้ และ sync `sources`/`incidents` เข้า Firestore อัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลง (ข้อมูลจะไม่หายเมื่อรีเฟรชหรือปิดเบราว์เซอร์อีกต่อไป)
- คนแรกที่สมัครสมาชิกจะได้เป็น Super Admin อัตโนมัติ (เพราะยังไม่มีแอดมินคนอื่นให้เลื่อนขั้นให้) คนถัดไปเริ่มเป็น user ธรรมดา ต้องรอแอดมินอนุมัติ/เลื่อนสิทธิ์จากหน้า User Management

### ⚠️ พบช่องโหว่ความปลอดภัยเพิ่มเติมระหว่างเชื่อม Auth — แก้แล้วทั้งหมด

ไฟล์ `LoginScreen.tsx` เดิมไม่ได้เป็นระบบ login จริงเลย พบปัญหาร้ายแรงหลายจุด:
1. **มีอีเมล/รหัสผ่านฝังตายในโค้ด** (`sithikorn247@gmail.com` / `korn30062544`) พิมพ์เข้าไปแล้วได้สิทธิ์ Super Admin ทันที — โค้ดนี้อยู่ใน public GitHub repo ด้วย **ถ้าเคยใช้รหัสผ่านนี้จริงที่ไหน ควรเปลี่ยนทันที**
2. ปุ่ม "Quick Login" กดแล้วเป็น Admin/User ได้เลยโดยไม่ต้องใส่รหัสผ่านอะไรเลย
3. `handleToggleRole` ใน `App.tsx` — ผู้ใช้ทั่วไปกดปุ่มเดียวก็กลายเป็น Admin ได้เอง (RBAC bypass สมบูรณ์)
4. Dropdown ใน TopAppBar/RBAC modal ที่สลับไปเป็น "ตัวตน" ผู้ใช้คนอื่นได้ทันทีโดยไม่ต้อง login ใหม่
5. หน้า "ลืมรหัสผ่าน" เป็นของปลอม (โชว์รหัส OTP บนหน้าจอ ไม่ได้ส่งอีเมลจริง)

ทั้งหมดนี้ถูกแทนที่ด้วย Firebase Authentication จริง: login/signup/logout จริง, ปุ่ม/ทางลัดที่ข้ามระบบสิทธิ์ทั้งหมดถูกตัดออก (เปลี่ยนเป็นบังคับ sign out แทน), และ "ลืมรหัสผ่าน" ส่งอีเมลจริงผ่าน Firebase

## 5. บั๊กอื่นๆ ที่เจอระหว่างตรวจโค้ด (แก้แล้ว) ✅

- **`handleAddIncident` ใน `App.tsx`**: ถ้ายังไม่มีข้อมูลในระบบเลย (โปรเจกต์ใหม่ล้วนๆ) การรายงานอุบัติการณ์ด้วยตนเองจะ**หายเงียบๆ**เพราะโค้ดวนลูปทับ array ที่ว่างเปล่า ไม่มี error ให้เห็นเลย — แก้ให้สร้างแหล่งข้อมูลเริ่มต้นให้อัตโนมัติถ้ายังไม่มี
- **ตัวกรองค้นหาอุบัติการณ์**: เรียก `.toLowerCase()` บนฟิลด์ `specimen` ที่เป็น optional โดยตรง ถ้าอุบัติการณ์ไหนไม่มีค่านี้จะ crash ทั้งหน้าค้นหาทันที (runtime TypeError) — แก้ให้ใช้ `?? ''` กันไว้
- **`handleDemoteAdmin` ใน `App.tsx`**: ตั้งค่า `roleType: 'General User'` ซึ่งไม่ใช่ค่าที่ถูกต้องตาม type `UserRole` ใน `types.ts` (ค่าจริงคือ `'User'`) — เป็น type error ที่ตรวจพบจากการรัน `tsc` ตรวจสอบโค้ด
- **`MolecularBioDashboard.tsx`** และ **`utils/multiSourceDataEngine.ts`**: ใช้ type `Department5YearStats` โดยไม่ได้ import จาก `types.ts` เลย — ทำให้ `npm run lint` (`tsc --noEmit`) พังทั้งคู่

ทั้งหมดนี้ตรวจพบจากการรัน TypeScript compiler จริงกับไฟล์ที่แก้ (ไม่ได้เดา) แม้จะรัน `npm install` เต็มรูปแบบไม่ได้เพราะเครื่องมือของผมไม่มีอินเทอร์เน็ต

## 6. สิ่งที่ยังไม่ได้ทำ (รอการตัดสินใจของคุณ) ⚠️

1. **หน้าตาเว็บให้เหมือนของเดิม + จัดโครงสร้างตาม ISO 15189** — ที่คุยกันไว้ก่อนหน้านี้ ยังไม่ได้ทำ เพราะยังไม่ได้รับสกรีนช็อตของเว็บเดิม ถ้าพร้อมส่งแล้วแจ้งได้เลยครับ
2. **"Add User" จากหน้า User Management** — ยังสร้างได้แค่ profile record ใน Firestore เท่านั้น **ไม่ได้สร้างบัญชี login จริง** เพราะการสร้างบัญชี Firebase Auth ให้คนอื่นต้องใช้ Admin SDK ฝั่งเซิร์ฟเวอร์ (client-side ทำไม่ได้) — คนที่ถูกเพิ่มต้องไปสมัครเองที่หน้า Sign Up ด้วยอีเมลเดียวกัน
3. **Dashboard บางหน้ายังมีตัวเลขที่ hardcode ไว้ตรงๆ** (เช่นหน้า "Six Sigma Performance", สัดส่วน 42%/28%/30% ของ rejected specimens) ไม่ได้คำนวณจากข้อมูลจริง — เป็นปัญหาแยกจากรอบนี้ ยังไม่ได้แก้ เพราะเป็นการตรวจสอบหน้า dashboard ทีละหน้าซึ่งขอบเขตใหญ่มาก แจ้งได้ถ้าอยากให้ไล่แก้ต่อ
4. โค้ดนี้ยังไม่ได้รันทดสอบจริงด้วย `npm install` + เปิดเบราว์เซอร์ดูจริง (เครื่องมือของผมไม่มีอินเทอร์เน็ต) — ตรวจสอบด้วยการอ่านโค้ดอย่างละเอียด + รัน TypeScript compiler สแกนหาข้อผิดพลาดแล้ว แต่แนะนำให้รัน `npm run dev:vercel` ทดสอบในเครื่องคุณก่อน deploy จริง

## วิธี Deploy ให้ใช้งานได้จริง

1. `npm install`
2. ตั้งค่า Environment Variables ใน `.env` (local) และใน **Vercel > Project Settings > Environment Variables** (production):
   - `GEMINI_API_KEY` — ห้ามใส่ prefix `VITE_` เพราะต้องอยู่ฝั่ง server เท่านั้น
   - `VITE_FIREBASE_*` ทั้งหมด (ดู `.env.example` — เติมค่าจาก `firebase-applet-config.json` ให้แล้ว)
3. ไปที่ Firebase Console เปิดใช้งาน **Authentication > Sign-in method > Email/Password** ถ้ายังไม่ได้เปิด (จำเป็นมาก ไม่งั้น login/signup จะ error)
4. Deploy Firestore rules: `firebase deploy --only firestore:rules` (ต้องติดตั้ง Firebase CLI ก่อน) หรือ copy เนื้อหาไฟล์ `firestore.rules` ไปวางใน Firebase Console > Firestore Database > Rules
5. ทดสอบในเครื่อง: `npm run dev` หรือ `npm run dev:vercel` (แนะนำตัวหลังก่อน deploy จริง)
6. Push ขึ้น GitHub แล้วเชื่อมกับ Vercel ตามปกติ ใส่ Environment Variables ชุดเดียวกับข้อ 2 แล้วกด Deploy

