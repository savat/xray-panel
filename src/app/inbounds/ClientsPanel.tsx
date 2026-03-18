'use client'
import { useState } from 'react'
import { addClient, updateClient, deleteClient, resetClientTraffic } from '@/lib/api'
import { formatBytes, formatDate, generateLink } from '@/lib/utils'
import { Plus, Trash2, Edit2, Copy, Check, RotateCcw, QrCode, Link2 } from 'lucide-react'

// QR code via Google Charts API (ไม่ต้อง install package)
const QR = ({ text, onClose }: { text: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
    onClick={onClose}>
    <div className="card p-5 flex flex-col items-center gap-3 max-w-xs w-full" onClick={e => e.stopPropagation()}>
      <p className="text-xs text-[#6888aa] text-center break-all">{text.slice(0,60)}...</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}&bgcolor=0d1420&color=00d4c8&margin=10`}
        alt="QR Code" className="rounded-lg" width={220} height={220}/>
      <button onClick={onClose} className="btn-ghost text-sm w-full">ปิด</button>
    </div>
  </div>
)

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16)
  })
}
function randomStr(n: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,n)
}

export default function ClientsPanel({ inbound, onRefresh }: { inbound: any; onRefresh: () => void }) {
  const settings: any  = typeof inbound.settings === 'string' ? JSON.parse(inbound.settings) : inbound.settings
  const clients: any[] = settings?.clients ?? []
  const protocol       = inbound.protocol

  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<any>(null)
  const [copied,   setCopied]   = useState('')
  const [qrText,   setQrText]   = useState('')

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  const handleDelete = async (clientId: string, email: string) => {
    if (!confirm(`ลบ client "${email}"?`)) return
    await deleteClient(inbound.id, clientId); onRefresh()
  }

  const handleResetTraffic = async (email: string) => {
    if (!confirm(`รีเซ็ต traffic ของ "${email}"?`)) return
    await resetClientTraffic(inbound.id, email); onRefresh()
  }

  const handleShare = (c: any) => {
    const link = generateLink(inbound, c)
    if (link) setQrText(link)
  }

  return (
    <div className="bg-[#080c12]/40">
      {qrText && <QR text={qrText} onClose={() => setQrText('')}/>}

      {(showForm || editing) && (
        <ClientForm
          inboundId={inbound.id} protocol={protocol} editing={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); onRefresh() }}/>
      )}

      {/* Mobile: card list */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3050]">
          <span className="text-xs text-[#6888aa]">{clients.length} clients</span>
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="btn-cyan flex items-center gap-1 text-xs py-1.5 px-3">
            <Plus size={12}/> เพิ่ม
          </button>
        </div>
        {clients.length === 0 ? (
          <p className="text-center text-[#6888aa] text-sm py-6">ยังไม่มี client</p>
        ) : (
          <div className="divide-y divide-[#1e3050]">
            {clients.map((c: any) => {
              const link = generateLink(inbound, c)
              const ck   = `m-${c.id||c.email}`
              return (
                <div key={c.id||c.email} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{c.email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${c.enable!==false?'text-green-400 bg-green-500/10':'text-red-400 bg-red-500/10'}`}>
                      {c.enable!==false?'เปิด':'ปิด'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[#6888aa] truncate flex-1">
                      {c.id||c.password||'—'}
                    </span>
                    <button onClick={() => copy(c.id||c.password||'', ck)}
                      className="text-[#3a5070] hover:text-[#00d4c8] shrink-0">
                      {copied===ck ? <Check size={12} className="text-green-400"/> : <Copy size={12}/>}
                    </button>
                  </div>
                  <div className="text-xs text-[#6888aa] flex gap-3">
                    <span>หมดอายุ: {formatDate(c.expiryTime??0)}</span>
                    <span>{(c.up||0)+(c.down||0)>0 ? formatBytes((c.up||0)+(c.down||0)) : '—'}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {link && <>
                      <button onClick={() => copy(link, `link-${c.id}`)}
                        className="btn-ghost flex items-center gap-1 text-xs py-1 px-2">
                        <Link2 size={11}/> Copy Link
                      </button>
                      <button onClick={() => handleShare(c)}
                        className="btn-ghost flex items-center gap-1 text-xs py-1 px-2">
                        <QrCode size={11}/> QR
                      </button>
                    </>}
                    <button onClick={() => { setEditing(c); setShowForm(false) }}
                      className="btn-ghost flex items-center gap-1 text-xs py-1 px-2">
                      <Edit2 size={11}/>
                    </button>
                    <button onClick={() => handleResetTraffic(c.email)}
                      className="btn-ghost flex items-center gap-1 text-xs py-1 px-2">
                      <RotateCcw size={11}/>
                    </button>
                    <button onClick={() => handleDelete(c.id, c.email)}
                      className="btn-danger flex items-center gap-1 text-xs py-1 px-2">
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e3050]">
              <th className="th">Email</th>
              <th className="th">UUID / Password</th>
              <th className="th">Traffic</th>
              <th className="th">หมดอายุ</th>
              <th className="th">สถานะ</th>
              <th className="th">
                <button onClick={() => { setEditing(null); setShowForm(true) }}
                  className="btn-cyan flex items-center gap-1 text-xs py-1 px-2 ml-auto">
                  <Plus size={11}/> เพิ่ม
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan={6} className="td text-center text-[#6888aa] py-6">ยังไม่มี client</td></tr>
            ) : clients.map((c: any) => {
              const link = generateLink(inbound, c)
              const ck   = `t-${c.id||c.email}`
              return (
                <tr key={c.id||c.email} className="hover:bg-[#0d1420] transition-colors">
                  <td className="td font-medium">{c.email}</td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-[#6888aa] truncate max-w-[140px]">{c.id||c.password||'—'}</span>
                      <button onClick={() => copy(c.id||c.password||'', ck)}
                        className="text-[#3a5070] hover:text-[#00d4c8] shrink-0">
                        {copied===ck ? <Check size={11} className="text-green-400"/> : <Copy size={11}/>}
                      </button>
                    </div>
                  </td>
                  <td className="td font-mono text-xs text-[#6888aa]">
                    {(c.up||0)+(c.down||0)>0 ? formatBytes((c.up||0)+(c.down||0)) : '—'}
                    {c.totalGB ? ` / ${c.totalGB}GB` : ''}
                  </td>
                  <td className="td text-xs text-[#6888aa]">{formatDate(c.expiryTime??0)}</td>
                  <td className="td">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.enable!==false?'text-green-400 bg-green-500/10':'text-red-400 bg-red-500/10'}`}>
                      {c.enable!==false?'เปิด':'ปิด'}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1 justify-end">
                      {link && <>
                        <button onClick={() => copy(link, `link-${c.id}`)} title="Copy Link"
                          className="p-1 text-[#6888aa] hover:text-[#00d4c8] transition-colors">
                          {copied===`link-${c.id}` ? <Check size={13} className="text-green-400"/> : <Link2 size={13}/>}
                        </button>
                        <button onClick={() => handleShare(c)} title="QR Code"
                          className="p-1 text-[#6888aa] hover:text-[#00d4c8] transition-colors">
                          <QrCode size={13}/>
                        </button>
                      </>}
                      <button onClick={() => { setEditing(c); setShowForm(false) }}
                        className="p-1 text-[#6888aa] hover:text-[#00d4c8] transition-colors">
                        <Edit2 size={13}/>
                      </button>
                      <button onClick={() => handleResetTraffic(c.email)}
                        className="p-1 text-[#6888aa] hover:text-yellow-400 transition-colors">
                        <RotateCcw size={13}/>
                      </button>
                      <button onClick={() => handleDelete(c.id, c.email)}
                        className="p-1 text-[#6888aa] hover:text-red-400 transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientForm({ inboundId, protocol, editing, onClose, onSaved }: any) {
  const [email,   setEmail]   = useState(editing?.email    || '')
  const [uuid,    setUuid]    = useState(editing?.id       || randomUUID())
  const [pass,    setPass]    = useState(editing?.password || '')
  const [flow,    setFlow]    = useState(editing?.flow     || '')
  const [enable,  setEnable]  = useState(editing?.enable   ?? true)
  const [totalGB, setTotalGB] = useState(editing?.totalGB  ?? 0)
  const [expiry,  setExpiry]  = useState(editing?.expiryTime ? new Date(editing.expiryTime).toISOString().slice(0,16) : '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const client: any = { email, enable, totalGB: parseInt(totalGB)||0, expiryTime: expiry ? new Date(expiry).getTime() : 0, flow }
    if (['vless','vmess'].includes(protocol)) client.id = uuid
    if (['trojan','shadowsocks'].includes(protocol)) client.password = pass || randomStr(16)
    try {
      if (editing) await updateClient(inboundId, editing.id||editing.email, client)
      else         await addClient(inboundId, client)
      onSaved()
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'เกิดข้อผิดพลาด')
    } finally { setLoading(false) }
  }

  return (
    <div className="border-b border-[#1e3050] bg-[#0d1420] p-4">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Email</label>
          <input className="input text-sm" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com" required/>
        </div>
        {['vless','vmess'].includes(protocol) && (
          <div>
            <label className="label">UUID</label>
            <div className="flex gap-1">
              <input className="input text-sm font-mono flex-1" value={uuid} onChange={e=>setUuid(e.target.value)}/>
              <button type="button" onClick={()=>setUuid(randomUUID())} className="btn-ghost text-xs px-2 shrink-0">สุ่ม</button>
            </div>
          </div>
        )}
        {['trojan','shadowsocks'].includes(protocol) && (
          <div>
            <label className="label">Password</label>
            <input className="input text-sm font-mono" value={pass} onChange={e=>setPass(e.target.value)} placeholder="ปล่อยว่างเพื่อสุ่ม"/>
          </div>
        )}
        {protocol === 'vless' && (
          <div>
            <label className="label">Flow</label>
            <select className="input text-sm" value={flow} onChange={e=>setFlow(e.target.value)}>
              <option value="">ไม่ระบุ</option>
              <option value="xtls-rprx-vision">xtls-rprx-vision</option>
            </select>
          </div>
        )}
        <div>
          <label className="label">จำกัด Traffic (GB, 0=ไม่จำกัด)</label>
          <input className="input text-sm" type="number" value={totalGB} onChange={e=>setTotalGB(e.target.value)} min={0}/>
        </div>
        <div>
          <label className="label">วันหมดอายุ</label>
          <input className="input text-sm" type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2 col-span-full">
          <input type="checkbox" id="cl-en" checked={enable} onChange={e=>setEnable(e.target.checked)} className="w-4 h-4 accent-[#00d4c8]"/>
          <label htmlFor="cl-en" className="text-sm">เปิดใช้งาน</label>
        </div>
        {error && <div className="col-span-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded">{error}</div>}
        <div className="col-span-full flex gap-2">
          <button type="submit" disabled={loading} className="btn-cyan text-xs py-1.5 px-4 disabled:opacity-40">
            {loading ? '...' : 'บันทึก'}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost text-xs py-1.5 px-4">ยกเลิก</button>
        </div>
      </form>
    </div>
  )
}
