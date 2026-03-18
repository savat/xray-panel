# 3x-ui Panel (Next.js)

หน้าเว็บ admin ใหม่สำหรับ 3x-ui — ธีม dark cyberpunk ภาษาไทย  
Deploy บน Vercel เชื่อมกับ 3x-ui ที่รันอยู่บน server โดยตรง

## วิธีการทำงาน

```
Browser → Vercel (Next.js API Route) → 3x-ui API บน server
```

Vercel เรียก 3x-ui แทน browser — แก้ปัญหา CORS และ self-signed SSL ได้โดยไม่ต้องแตะ server เลย

## ฟีเจอร์

- ✅ แดชบอร์ด — CPU, RAM, Disk, Traffic, Uptime
- ✅ Inbounds — เพิ่ม/แก้ไข/ลบ + จัดการ client ในที่เดียว
- ✅ Clients — ดูทุก client จากทุก inbound พร้อม search
- ✅ ตั้งค่า — แก้ panel settings + เปลี่ยนรหัสผ่าน
- ✅ รองรับ VLESS, VMess, Trojan, Shadowsocks, Socks, HTTP
- ✅ ภาษาไทยทั้งหมด

## วิธีติดตั้ง

### 1. Push โฟลเดอร์นี้ขึ้น GitHub

### 2. Import เข้า Vercel
- New Project → Import จาก GitHub
- Framework: **Next.js**
- Root Directory: ถ้าวางไว้ใน subfolder ให้ระบุ

### 3. ตั้งค่า Environment Variables ใน Vercel

| Key | ค่า |
|-----|-----|
| `XUI_BASE_URL` | `https://SERVER_IP:17170` |
| `XUI_BASE_PATH` | `/79xEeZlZwGcyK79cW9` |
| `NEXT_PUBLIC_XUI_URL` | `https://SERVER_IP:17170` (optional) |

> ดูค่าจริงจากการรัน `/usr/local/x-ui/x-ui setting -show true` บน server

### 4. Deploy → เสร็จ

## วิธีใช้งาน

เปิดหน้าเว็บ Vercel → Login ด้วย username/password เดิมของ 3x-ui

## โครงสร้างไฟล์

```
src/
├── app/
│   ├── api/proxy/[...path]/route.ts  ← proxy ทุก request ไปที่ 3x-ui
│   ├── login/           หน้า login
│   ├── dashboard/       แดชบอร์ด
│   ├── inbounds/        จัดการ inbound + client
│   ├── clients/         ดู client ทั้งหมด
│   └── settings/        ตั้งค่า + เปลี่ยน password
├── components/
│   ├── Sidebar.tsx
│   └── DashboardLayout.tsx
└── lib/
    ├── api.ts           เรียก 3x-ui ผ่าน proxy
    └── utils.ts         formatBytes, formatDate, etc.
```

## หมายเหตุ

- `NODE_TLS_REJECT_UNAUTHORIZED=0` ใน `next.config.js` ทำให้ Vercel ยอมรับ self-signed cert ของ 3x-ui
- Session ใช้ cookie ของ 3x-ui โดยตรง ไม่มี auth layer เพิ่มเติม
- ถ้าต้องการ HTTPS จริงบน 3x-ui ให้ใส่ cert ด้วย Let's Encrypt แล้วเปลี่ยน `NODE_TLS_REJECT_UNAUTHORIZED` กลับเป็น `1`
