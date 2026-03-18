import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))

export const formatBytes = (b: number): string => {
  if (!b || b === 0) return '0 B'
  const k = 1024, s = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${(b / Math.pow(k, i)).toFixed(2)} ${s[i]}`
}

export const formatDate = (ms: number): string => {
  if (!ms || ms <= 0) return 'ไม่จำกัด'
  return new Date(ms).toLocaleDateString('th-TH', {
    year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
  })
}

export const PROTOCOL_BADGE: Record<string, string> = {
  vless:       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  vmess:       'bg-blue-500/20   text-blue-300   border-blue-500/30',
  trojan:      'bg-red-500/20    text-red-300    border-red-500/30',
  shadowsocks: 'bg-green-500/20  text-green-300  border-green-500/30',
  socks:       'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  http:        'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

// ── Generate share link ───────────────────────────────────────
export function generateLink(inbound: any, client: any): string {
  const settings = parse(inbound.settings)
  const stream   = parse(inbound.streamSettings)
  const protocol = inbound.protocol
  const port     = inbound.port
  const host     = typeof window !== 'undefined' ? window.location.hostname : 'YOUR_SERVER_IP'
  const remark   = encodeURIComponent(client.email || 'client')

  if (protocol === 'vmess') {
    const obj: any = {
      v: '2', ps: client.email, add: host, port: String(port),
      id: client.id, aid: '0', scy: 'auto',
      net: stream?.network || 'tcp',
      type: 'none', tls: stream?.security || 'none',
    }
    if (stream?.network === 'ws') {
      obj.path = stream?.wsSettings?.path || '/'
      obj.host = stream?.wsSettings?.headers?.Host || host
    }
    if (stream?.network === 'grpc') {
      obj.path = stream?.grpcSettings?.serviceName || ''
      obj.type = 'gun'
    }
    return 'vmess://' + btoa(JSON.stringify(obj))
  }

  if (protocol === 'vless') {
    const params = new URLSearchParams()
    params.set('type',     stream?.network || 'tcp')
    params.set('security', stream?.security || 'none')
    if (client.flow) params.set('flow', client.flow)
    if (stream?.network === 'ws') {
      params.set('path', stream?.wsSettings?.path || '/')
      params.set('host', stream?.wsSettings?.headers?.Host || host)
    }
    if (stream?.security === 'reality') {
      const r = stream?.realitySettings || {}
      params.set('pbk',  r.publicKey || '')
      params.set('fp',   r.fingerprint || 'chrome')
      params.set('sni',  (r.serverNames || [])[0] || host)
      params.set('sid',  (r.shortIds || [])[0] || '')
    }
    if (stream?.security === 'tls') {
      params.set('sni', (stream?.tlsSettings?.serverNames || [])[0] || host)
    }
    return `vless://${client.id}@${host}:${port}?${params.toString()}#${remark}`
  }

  if (protocol === 'trojan') {
    const params = new URLSearchParams()
    params.set('type',     stream?.network || 'tcp')
    params.set('security', stream?.security || 'tls')
    if (stream?.tlsSettings?.serverName) params.set('sni', stream.tlsSettings.serverName)
    return `trojan://${client.password}@${host}:${port}?${params.toString()}#${remark}`
  }

  if (protocol === 'shadowsocks') {
    const method  = settings?.method || 'chacha20-ietf-poly1305'
    const pass    = client.password || ''
    const encoded = btoa(`${method}:${pass}`)
    return `ss://${encoded}@${host}:${port}#${remark}`
  }

  return ''
}

function parse(s: any) {
  if (!s) return {}
  if (typeof s === 'string') { try { return JSON.parse(s) } catch { return {} } }
  return s
}
