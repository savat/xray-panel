import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

// ปิด TLS verification เพราะ 3x-ui ใช้ self-signed cert
const agent = new https.Agent({ rejectUnauthorized: false })

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, 'GET')
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, 'POST')
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, 'PUT')
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, 'DELETE')
}

async function proxy(req: NextRequest, pathParts: string[], method: string) {
  const BASE_URL  = process.env.XUI_BASE_URL  || ''
  const BASE_PATH = process.env.XUI_BASE_PATH || ''

  if (!BASE_URL) {
    return NextResponse.json(
      { success: false, msg: 'XUI_BASE_URL ยังไม่ได้ตั้งค่าใน Vercel env' },
      { status: 500 }
    )
  }

  const path   = pathParts.join('/')
  const search = req.nextUrl.search
  const target = `${BASE_URL}${BASE_PATH}/${path}${search}`

  console.log('[proxy]', method, target)

  // forward cookies (session ของ 3x-ui)
  const cookies = req.headers.get('cookie') || ''

  const headers: Record<string, string> = {
    'Cookie':       cookies,
    'Content-Type': req.headers.get('content-type') || 'application/json',
    'Accept':       'application/json, text/plain, */*',
  }

  let body: string | undefined
  if (method !== 'GET' && method !== 'DELETE') {
    try { body = await req.text() } catch {}
  }

  try {
    // @ts-ignore — agent ใช้สำหรับ Node.js fetch (undici)
    const res = await fetch(target, { method, headers, body, agent })

    const data      = await res.text()
    const setCookie = res.headers.get('set-cookie')

    console.log('[proxy] response', res.status, target)

    const resHeaders: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    }
    if (setCookie) resHeaders['set-cookie'] = setCookie

    return new NextResponse(data, { status: res.status, headers: resHeaders })
  } catch (err: any) {
    console.error('[proxy error]', err.message, target)
    return NextResponse.json(
      { success: false, msg: `เชื่อมต่อ 3x-ui ไม่ได้: ${err.message}` },
      { status: 502 }
    )
  }
}
