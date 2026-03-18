'use client'
import { useState } from 'react'
import { addInbound, updateInbound } from '@/lib/api'
import { RefreshCw } from 'lucide-react'

const PROTOCOLS  = ['vless','vmess','trojan','shadowsocks','socks','http']
const NETWORKS   = ['tcp','ws','grpc','quic','httpupgrade','splithttp']
const SS_METHODS = ['chacha20-ietf-poly1305','aes-256-gcm','aes-128-gcm','2022-blake3-aes-256-gcm','2022-blake3-chacha20-poly1305']
const RESETS     = ['Never','Day','Week','Month']

function rand(n: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,n)
}
function randUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16)
  })
}

// generate Reality keypair via xray (client-side workaround: use random base64)
function randBase64(n: number) {
  const arr = crypto.getRandomValues(new Uint8Array(n))
  return btoa(String.fromCharCode(...arr)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
}

export default function InboundModal({ data, onClose, onSaved }: any) {
  const editing = !!data
  const parse   = (s: any) => { try { return typeof s==='string' ? JSON.parse(s) : s } catch { return {} } }

  const initStream = parse(data?.streamSettings)
  const initSniff  = parse(data?.sniffing)

  // basic
  const [enabled,   setEnabled]   = useState(data?.enable  ?? true)
  const [remark,    setRemark]    = useState(data?.remark   || '')
  const [protocol,  setProtocol]  = useState(data?.protocol || 'vless')
  const [listenIP,  setListenIP]  = useState(data?.listen   || '')
  const [port,      setPort]      = useState(data?.port     || '')
  const [totalFlow, setTotalFlow] = useState(data?.total    || 0)
  const [reset,     setReset]     = useState('Never')
  const [expiry,    setExpiry]    = useState(data?.expiryTime ? new Date(data.expiryTime).toISOString().slice(0,16) : '')

  // stream
  const [network,   setNetwork]   = useState(initStream?.network   || 'tcp')
  const [security,  setSecurity]  = useState(initStream?.security  || 'none')
  const [wsPath,    setWsPath]    = useState(initStream?.wsSettings?.path || '/ws')
  const [wsHost,    setWsHost]    = useState(initStream?.wsSettings?.headers?.Host || '')
  const [grpcSvc,   setGrpcSvc]   = useState(initStream?.grpcSettings?.serviceName || '')
  const [grpcMode,  setGrpcMode]  = useState(initStream?.grpcSettings?.multiMode ? 'multi' : 'gun')

  // TLS
  const tlsS = initStream?.tlsSettings || {}
  const [tlsSni,    setTlsSni]    = useState(tlsS.serverName || '')
  const [tlsCert,   setTlsCert]   = useState(tlsS.certificates?.[0]?.certificateFile || '')
  const [tlsKey,    setTlsKey]    = useState(tlsS.certificates?.[0]?.keyFile || '')

  // Reality
  const realS = initStream?.realitySettings || {}
  const [realDest,  setRealDest]  = useState(realS.dest       || 'www.google.com:443')
  const [realSni,   setRealSni]   = useState((realS.serverNames||['www.google.com']).join(','))
  const [realPvk,   setRealPvk]   = useState(realS.privateKey  || '')
  const [realPbk,   setRealPbk]   = useState(realS.publicKey   || '')
  const [realShort, setRealShort] = useState((realS.shortIds||['']).join(','))
  const [realFp,    setRealFp]    = useState(realS.fingerprint || 'chrome')

  // SS
  const ssS = parse(data?.settings)
  const [ssMethod,  setSsMethod]  = useState(ssS?.method   || 'chacha20-ietf-poly1305')
  const [ssPass,    setSsPass]    = useState(ssS?.password || '')

  // sniffing
  const [sniffEnable,  setSniffEnable]  = useState(initSniff?.enabled  ?? true)
  const [sniffDest,    setSniffDest]    = useState<string[]>(initSniff?.destOverride || ['http','tls','quic'])

  const [activeTab, setActiveTab] = useState<'basic'|'stream'|'security'|'sniffing'>('basic')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const toggleSniffDest = (v: string) =>
    setSniffDest(p => p.includes(v) ? p.filter(x=>x!==v) : [...p, v])

  const genRealityKeys = () => {
    // client-side placeholder — ใน production ควรเรียก xray keygen บน server
    setRealPvk(randBase64(32))
    setRealPbk(randBase64(32))
    setRealShort(rand(8))
  }

  const buildPayload = () => {
    let settings: any = {}
    let streamSettings: any = { network, security }
    const sniffing = { enabled: sniffEnable, destOverride: sniffDest }

    // settings by protocol
    if (protocol === 'vless')  settings = { clients: [], decryption: 'none', fallbacks: [] }
    if (protocol === 'vmess')  settings = { clients: [] }
    if (protocol === 'trojan') settings = { clients: [], fallbacks: [] }
    if (protocol === 'shadowsocks') {
      settings = { method: ssMethod, password: ssPass || rand(16), network: 'tcp,udp' }
    }
    if (protocol === 'socks')  settings = { auth: 'noauth', udp: true, ip: '' }
    if (protocol === 'http')   settings = { accounts: [], allowTransparent: false }

    // network stream
    if (network === 'ws')          streamSettings.wsSettings          = { path: wsPath, headers: wsHost ? { Host: wsHost } : {} }
    if (network === 'grpc')        streamSettings.grpcSettings        = { serviceName: grpcSvc, multiMode: grpcMode === 'multi' }
    if (network === 'httpupgrade') streamSettings.httpupgradeSettings = { path: wsPath, host: wsHost }
    if (network === 'splithttp')   streamSettings.splithttpSettings   = { path: wsPath, host: wsHost }

    // security
    if (security === 'tls') {
      streamSettings.tlsSettings = {
        serverName: tlsSni,
        certificates: tlsCert ? [{ certificateFile: tlsCert, keyFile: tlsKey }] : []
      }
    }
    if (security === 'reality') {
      streamSettings.realitySettings = {
        show: false,
        dest: realDest,
        xver: 0,
        serverNames: realSni.split(',').map((s:string)=>s.trim()).filter(Boolean),
        privateKey: realPvk,
        publicKey:  realPbk,
        shortIds: realShort.split(',').map((s:string)=>s.trim()).filter(Boolean),
        fingerprint: realFp,
      }
    }

    return {
      enable: enabled,
      remark,
      listen: listenIP,
      port: parseInt(port),
      protocol,
      total: parseInt(String(totalFlow)) || 0,
      expiryTime: expiry ? new Date(expiry).getTime() : 0,
      settings:       JSON.stringify(settings),
      streamSettings: JSON.stringify(streamSettings),
      sniffing:       JSON.stringify(sniffing),
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const payload = buildPayload()
      if (editing) await updateInbound(data.id, payload)
      else         await addInbound(payload)
      onSaved()
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'เกิดข้อผิดพลาด')
    } finally { setLoading(false) }
  }

  const TABS = [
    { key:'basic',    label:'พื้นฐาน' },
    { key:'stream',   label:'Transmission' },
    { key:'security', label:'Security' },
    { key:'sniffing', label:'Sniffing' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="card w-full max-w-lg max-h-[92vh] flex flex-col"
        style={{boxShadow:'0 20px 60px rgba(0,0,0,.7)'}}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3050] bg-[#111a2b] shrink-0">
          <h2 className="font-semibold">{editing ? 'แก้ไข Inbound' : 'เพิ่ม Inbound'}</h2>
          <button onClick={onClose} className="text-[#6888aa] hover:text-red-400 text-xl leading-none">&times;</button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-[#1e3050] shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === t.key
                  ? 'border-[#00d4c8] text-[#00d4c8]'
                  : 'border-transparent text-[#6888aa] hover:text-[#c8daf0]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">

            {/* ── Basic Tab ── */}
            {activeTab === 'basic' && (
              <>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ib-en" checked={enabled} onChange={e=>setEnabled(e.target.checked)} className="w-4 h-4 accent-[#00d4c8]"/>
                  <label htmlFor="ib-en" className="text-sm font-medium">เปิดใช้งาน</label>
                </div>
                <div>
                  <label className="label">Remark</label>
                  <input className="input" value={remark} onChange={e=>setRemark(e.target.value)} placeholder="ชื่อ inbound"/>
                </div>
                <div>
                  <label className="label">Protocol</label>
                  <select className="input" value={protocol} onChange={e=>setProtocol(e.target.value)}>
                    {PROTOCOLS.map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Listen IP (ว่าง = ทั้งหมด)</label>
                    <input className="input font-mono" value={listenIP} onChange={e=>setListenIP(e.target.value)} placeholder="0.0.0.0"/>
                  </div>
                  <div>
                    <label className="label">Port</label>
                    <input className="input" type="number" value={port} onChange={e=>setPort(e.target.value)} required min={1} max={65535}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Total Flow (GB, 0=ไม่จำกัด)</label>
                    <input className="input" type="number" value={totalFlow} onChange={e=>setTotalFlow(+e.target.value)} min={0}/>
                  </div>
                  <div>
                    <label className="label">Traffic Reset</label>
                    <select className="input" value={reset} onChange={e=>setReset(e.target.value)}>
                      {RESETS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">วันหมดอายุ</label>
                  <input className="input" type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}/>
                </div>
                {/* Shadowsocks specific */}
                {protocol === 'shadowsocks' && (
                  <div className="space-y-3 border border-[#1e3050] rounded-lg p-3">
                    <p className="text-xs font-medium text-[#6888aa] uppercase tracking-wide">Shadowsocks</p>
                    <div>
                      <label className="label">Method</label>
                      <select className="input" value={ssMethod} onChange={e=>setSsMethod(e.target.value)}>
                        {SS_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Password (ว่าง = สุ่ม)</label>
                      <input className="input font-mono" value={ssPass} onChange={e=>setSsPass(e.target.value)}/>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Stream / Transmission Tab ── */}
            {activeTab === 'stream' && (
              <>
                <div>
                  <label className="label">Network</label>
                  <select className="input" value={network} onChange={e=>setNetwork(e.target.value)}>
                    {NETWORKS.map(n=><option key={n} value={n}>{n.toUpperCase()}</option>)}
                  </select>
                </div>
                {['ws','httpupgrade','splithttp'].includes(network) && (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Path</label>
                      <input className="input font-mono" value={wsPath} onChange={e=>setWsPath(e.target.value)} placeholder="/ws"/>
                    </div>
                    <div>
                      <label className="label">Host Header (optional)</label>
                      <input className="input font-mono" value={wsHost} onChange={e=>setWsHost(e.target.value)} placeholder="example.com"/>
                    </div>
                  </div>
                )}
                {network === 'grpc' && (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Service Name</label>
                      <input className="input font-mono" value={grpcSvc} onChange={e=>setGrpcSvc(e.target.value)}/>
                    </div>
                    <div>
                      <label className="label">Mode</label>
                      <select className="input" value={grpcMode} onChange={e=>setGrpcMode(e.target.value)}>
                        <option value="gun">gun</option>
                        <option value="multi">multi</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <>
                {/* Security selector */}
                <div className="flex gap-2">
                  {['none','tls','reality'].map(s => (
                    <button key={s} type="button" onClick={() => setSecurity(s)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        security === s
                          ? 'bg-[#00d4c8] text-[#080c12] border-[#00d4c8]'
                          : 'border-[#254060] text-[#6888aa] hover:border-[#00a89e]'
                      }`}>
                      {s === 'none' ? 'None' : s === 'tls' ? 'TLS' : 'Reality'}
                    </button>
                  ))}
                </div>

                {security === 'tls' && (
                  <div className="space-y-3 border border-[#1e3050] rounded-lg p-3">
                    <p className="text-xs font-medium text-[#6888aa] uppercase tracking-wide">TLS Settings</p>
                    <div>
                      <label className="label">Domain / SNI</label>
                      <input className="input font-mono" value={tlsSni} onChange={e=>setTlsSni(e.target.value)} placeholder="example.com"/>
                    </div>
                    <div>
                      <label className="label">Certificate File Path</label>
                      <input className="input font-mono text-sm" value={tlsCert} onChange={e=>setTlsCert(e.target.value)} placeholder="/root/cert/domain/fullchain.pem"/>
                    </div>
                    <div>
                      <label className="label">Key File Path</label>
                      <input className="input font-mono text-sm" value={tlsKey} onChange={e=>setTlsKey(e.target.value)} placeholder="/root/cert/domain/privkey.pem"/>
                    </div>
                  </div>
                )}

                {security === 'reality' && (
                  <div className="space-y-3 border border-[#1e3050] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#6888aa] uppercase tracking-wide">Reality Settings</p>
                      <button type="button" onClick={genRealityKeys}
                        className="btn-ghost flex items-center gap-1 text-xs py-1 px-2">
                        <RefreshCw size={11}/> Get New Keys
                      </button>
                    </div>
                    <div>
                      <label className="label">Dest (SNI Target)</label>
                      <input className="input font-mono text-sm" value={realDest} onChange={e=>setRealDest(e.target.value)} placeholder="www.google.com:443"/>
                    </div>
                    <div>
                      <label className="label">Server Names (คั่นด้วย ,)</label>
                      <input className="input font-mono text-sm" value={realSni} onChange={e=>setRealSni(e.target.value)} placeholder="www.google.com"/>
                    </div>
                    <div>
                      <label className="label">Private Key</label>
                      <input className="input font-mono text-xs" value={realPvk} onChange={e=>setRealPvk(e.target.value)}/>
                    </div>
                    <div>
                      <label className="label">Public Key</label>
                      <input className="input font-mono text-xs" value={realPbk} onChange={e=>setRealPbk(e.target.value)}/>
                    </div>
                    <div>
                      <label className="label">Short IDs (คั่นด้วย ,)</label>
                      <input className="input font-mono text-sm" value={realShort} onChange={e=>setRealShort(e.target.value)}/>
                    </div>
                    <div>
                      <label className="label">Fingerprint</label>
                      <select className="input" value={realFp} onChange={e=>setRealFp(e.target.value)}>
                        {['chrome','firefox','safari','ios','android','edge','360','qq','random','randomized'].map(f=>(
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Sniffing Tab ── */}
            {activeTab === 'sniffing' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sniff-en" checked={sniffEnable} onChange={e=>setSniffEnable(e.target.checked)} className="w-4 h-4 accent-[#00d4c8]"/>
                  <label htmlFor="sniff-en" className="text-sm font-medium">เปิดใช้งาน Sniffing</label>
                </div>
                {sniffEnable && (
                  <div className="space-y-2">
                    <label className="label">Dest Override</label>
                    {['http','tls','quic','fakedns'].map(v => (
                      <div key={v} className="flex items-center gap-2">
                        <input type="checkbox" id={`sniff-${v}`}
                          checked={sniffDest.includes(v)}
                          onChange={() => toggleSniffDest(v)}
                          className="w-4 h-4 accent-[#00d4c8]"/>
                        <label htmlFor={`sniff-${v}`} className="text-sm font-mono">{v}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* footer */}
          <div className="px-5 pb-5 space-y-3">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-cyan flex-1 disabled:opacity-40">
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
         }
        
