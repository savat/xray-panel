'use client'
import { useEffect, useState, useCallback } from 'react'
import { getInbounds, deleteInbound, resetTraffic } from '@/lib/api'
import { formatBytes, PROTOCOL_BADGE, cn } from '@/lib/utils'
import { Plus, Trash2, Edit2, Users, RotateCcw, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import InboundModal from './InboundModal'
import ClientsPanel from './ClientsPanel'

export default function InboundsPage() {
  const [inbounds, setInbounds] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<{open:boolean;data?:any}>({open:false})
  const [expanded, setExpanded] = useState<number|null>(null)

  const fetch = useCallback(async () => {
    try { const r = await getInbounds(); setInbounds(r.obj ?? []) }
    catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const handleDelete = async (id: number, remark: string) => {
    if (!confirm(`ลบ inbound "${remark}"?`)) return
    await deleteInbound(id); fetch()
  }
  const handleReset = async (id: number) => {
    if (!confirm('รีเซ็ต traffic ทั้งหมดของ inbound นี้?')) return
    await resetTraffic(id); fetch()
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Inbounds</h1>
          <p className="text-[#6888aa] text-xs mt-0.5">{inbounds.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="btn-ghost p-2"><RefreshCw size={14}/></button>
          <button onClick={() => setModal({open:true})} className="btn-cyan flex items-center gap-1.5 text-sm">
            <Plus size={14}/> <span className="hidden sm:inline">เพิ่ม</span> Inbound
          </button>
        </div>
      </div>

      {modal.open && (
        <InboundModal data={modal.data} onClose={() => setModal({open:false})}
          onSaved={() => { setModal({open:false}); fetch() }}/>
      )}

      {loading ? (
        <div className="card p-10 text-center text-[#6888aa]">กำลังโหลด...</div>
      ) : inbounds.length === 0 ? (
        <div className="card p-10 text-center text-[#6888aa]">ยังไม่มี inbound — กดเพิ่มเพื่อเริ่ม</div>
      ) : (
        <div className="space-y-2">
          {inbounds.map(ib => {
            const isOpen   = expanded === ib.id
            const settings = typeof ib.settings === 'string' ? JSON.parse(ib.settings) : ib.settings
            const clientCount = settings?.clients?.length ?? 0
            return (
              <div key={ib.id} className="card overflow-hidden">
                {/* row */}
                <div className="flex items-center gap-2 px-3 md:px-5 py-3 md:py-4">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', ib.enable ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-[#3a5070]')}/>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded border font-mono shrink-0', PROTOCOL_BADGE[ib.protocol] ?? '')}>
                    {ib.protocol?.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{ib.remark || '—'}</span>
                    <span className="text-[#6888aa] text-xs font-mono">:{ib.port}</span>
                  </div>
                  {/* traffic — ซ่อนบนมือถือเล็กมาก */}
                  <div className="hidden sm:flex items-center gap-3 text-xs font-mono shrink-0">
                    <span className="text-green-400">↑{formatBytes(ib.up??0)}</span>
                    <span className="text-blue-400">↓{formatBytes(ib.down??0)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#6888aa] shrink-0">
                    <Users size={12}/>{clientCount}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => handleReset(ib.id)} className="p-1.5 text-[#6888aa] hover:text-yellow-400 transition-colors">
                      <RotateCcw size={13}/>
                    </button>
                    <button onClick={() => setModal({open:true,data:ib})} className="p-1.5 text-[#6888aa] hover:text-[#00d4c8] transition-colors">
                      <Edit2 size={13}/>
                    </button>
                    <button onClick={() => handleDelete(ib.id, ib.remark)} className="p-1.5 text-[#6888aa] hover:text-red-400 transition-colors">
                      <Trash2 size={13}/>
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : ib.id)} className="p-1.5 text-[#6888aa] hover:text-[#c8daf0] transition-colors ml-1">
                      {isOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-[#1e3050]">
                    <ClientsPanel inbound={ib} onRefresh={fetch}/>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
