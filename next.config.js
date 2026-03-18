/** @type {import('next').NextConfig} */
const nextConfig = {
  // ให้ Node.js ใน Vercel ไม่ reject self-signed cert ของ 3x-ui
  serverRuntimeConfig: {
    nodeOptions: '--tls-reject-unauthorized=0',
  },
}

// ปิด TLS verification สำหรับ server-side fetch
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

module.exports = nextConfig
