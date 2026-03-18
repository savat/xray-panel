'use client'
import { useEffect, useState } from 'react'
import { getInbounds, getOnlineClients } from '@/lib/api'
import { formatBytes, formatDate, PROTOCOL_BADGE, cn } from '@/lib/utils'
import { Search, Wifi } from 'lucide-react'

export default function ClientsPage() {
  const [inbounds, setInbounds] = useState<any[]>([])
  const [online,   setOnline]   = useState<string[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      getInbounds().then(r => setInbounds(r.obj ?? [])),
      getOnlineClients().then(r => setOnline(r.obj ?? [])).catch(() => {})
    ]).finally(() => setLoading(false))
  }, [])

  const all = inbounds.flatMap(ib => {
    const s = typeof ib.settings === 'string' ? JSON.parse(ib.settings) : ib.settings
    return (s?.clients ?? []).map((c: any) => ({ ...c, _ib: ib }))
  })

  const filtered = all.filter(c => {
    const q = search.toLowerCase()
    return c.email?.toLowerCase().includes(q) ||
      (c.id||'').includes(q) ||
      c._ib.remark?.toLowerCase().includes(q)
  })

  const onlineCount = all.filter(c => online.includes(c.email)).length

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Clients ทั้งหมด</h1>
          <p className="text-[#6888aa] text-xs mt-0.5">
            {all.length} รายการ
            {onlineCount > 0 && <span className="ml-2 text-green-400">• {onlineCount} ออนไลน์</span>}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5070]"/>
        <input className="input pl-9 text-sm" placeholder="ค้นหา email, UUID, inbound..."
          value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {loading ? <p className="text-center text-[#6888aa] py-8">กำลังโหลด...</p>
        : filtered.length === 0 ? <p className="text-center text-[#6888aa] py-8">{search?'ไม่พบผลลัพธ์':'ยังไม่มี client'}</p>
        : filtered.map((c, i) => {
          const isOnline = online.includes(c.email)
          return (
            <div key={`${c._ib.id}-${i}`} className="card p-4 space-y-2">
              <div className="flex items-center gap-2">
                {isOnline && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 shadow-[0_0_6px_#4ade80]"/>}
                <span className="font-medium text-sm flex-1">{c.email}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded border font-mono', PROTOCOL_BADGE[c._ib.protocol]??'')}>
                  {c._ib.protocol?.toUpperCase()}
                </span>
              </div>
              <div className="font-mono text-xs text-[#6888aa] truncate">{c.id||c.password||'—'}</div>
              <div className="flex gap-3 text-xs text-[#6888aa]">
                <span>{c._ib.remark||`port:${c._ib.port}`}</span>
                <span>{(c.up||0)+(c.down||0)>0?formatBytes((c.up||0)+(c.down||0)):'—'}</span>
                <span>{formatDate(c.expiryTime??0)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-hidden">
        {loading ? <p className="p-8 text-center text-[#6888aa]">กำลังโหลด...</p>
        : filtered.length === 0 ? <p className="p-8 text-center text-[#6888aa]">{search?'ไม่พบผลลัพธ์':'ยังไม่มี client'}</p>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3050] bg-[#111a2b]">
                <th className="th">Email</th>
                <th className="th">Inbound</th>
                <th className="th">UUID / Password</th>
                <th className="th">Traffic</th>
                <th className="th">หมดอายุ</th>
                <th className="th">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const isOnline = online.includes(c.email)
                return (
                  <tr key={`${c._ib.id}-${i}`} className="hover:bg-[#111a2b] transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {isOnline && <Wifi size={12} className="text-green-400 shrink-0"/>}
                        <span className="font-medium">{c.email}</span>
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border font-mono', PROTOCOL_BADGE[c._ib.protocol]??'')}>
                          {c._ib.protocol?.toUpperCase()}
                        </span>
                        <span className="text-[#6888aa] text-xs">{c._ib.remark||`port:${c._ib.port}`}</span>
                      </div>
                    </td>
                    <td className="td">
                      <span className="font-mono text-xs text-[#6888aa] truncate block max-w-[160px]">{c.id||c.password||'—'}</span>
                    </td>
                    <td className="td font-mono text-xs text-[#6888aa]">
                      {(c.up||0)+(c.down||0)>0?formatBytes((c.up||0)+(c.down||0)):'—'}
                      {c.totalGB?` / ${c.totalGB}GB`:''}
                    </td>
                    <td className="td text-xs text-[#6888aa]">{formatDate(c.expiryTime??0)}</td>
                    <td className="td">
                      <span className={`text-xs px-2 py-0.5 rounded ${isOnline?'text-green-400 bg-green-500/10':c.enable!==false?'text-[#6888aa] bg-[#1e3050]':'text-red-400 bg-red-500/10'}`}>
                        {isOnline?'ออนไลน์':c.enable!==false?'เปิด':'ปิด'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
