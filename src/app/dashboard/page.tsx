'use client'
import { useEffect, useState, useCallback } from 'react'
import { getStatus, getXrayInfo, restartXray, stopXray, startXray } from '@/lib/api'
import { formatBytes } from '@/lib/utils'
import { RefreshCw, Play, Square, RotateCcw, Wifi, Clock, Cpu, HardDrive, MemoryStick, Activity, Network, Globe } from 'lucide-react'

export default function DashboardPage() {
  const [status,  setStatus]  = useState<any>(null)
  const [xray,    setXray]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState('')

  const fetch = useCallback(async () => {
    try {
      const [s, x] = await Promise.all([getStatus(), getXrayInfo()])
      setStatus(s.obj); setXray(x.obj)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch(); const t = setInterval(fetch, 5000); return () => clearInterval(t) }, [fetch])

  const act = async (fn: () => Promise<any>, label: string) => {
    setActing(label); await fn().catch(() => {}); await fetch(); setActing('')
  }

  const running  = xray?.state === 'running'
  const cpuPct   = status?.cpu  ? +(status.cpu).toFixed(2) : 0
  const memPct   = status ? Math.round((status.mem.current  / status.mem.total)  * 100) : 0
  const swapPct  = status?.swap?.total > 0 ? Math.round((status.swap.current / status.swap.total) * 100) : 0
  const diskPct  = status ? Math.round((status.disk.current / status.disk.total) * 100) : 0
  const col      = (p: number) => p > 80 ? '#ff4d6a' : p > 60 ? '#ffca44' : '#00d4c8'

  // uptime formatter
  const fmt = (s: number) => {
    const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60)
    return [d&&`${d}ว`, h&&`${h}ชม`, `${m}น`].filter(Boolean).join(' ')
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-semibold">แดชบอร์ด</h1>
        <button onClick={fetch} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''}/> รีเฟรช
        </button>
      </div>

      {/* gauges — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:'CPU', pct:cpuPct, sub:`${status?.cpuCores??'-'} Core • ${status?.cpuSpeedMhz ? (status.cpuSpeedMhz/1000).toFixed(1)+'GHz' : ''}` },
          { label:'RAM', pct:memPct, sub:status ? `${formatBytes(status.mem.current)} / ${formatBytes(status.mem.total)}` : '-' },
          { label:'Swap', pct:swapPct, sub:status?.swap?.total > 0 ? `${formatBytes(status.swap.current)} / ${formatBytes(status.swap.total)}` : '0 B / 0 B' },
          { label:'Disk', pct:diskPct, sub:status ? `${formatBytes(status.disk.current)} / ${formatBytes(status.disk.total)}` : '-' },
        ].map(({ label, pct, sub }) => (
          <div key={label} className="card p-4 flex flex-col items-center gap-2">
            {/* circular gauge */}
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#1e3050" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15" fill="none"
                  stroke={col(pct)} strokeWidth="3"
                  strokeDasharray={`${pct * 0.942} 94.2`}
                  strokeLinecap="round" className="transition-all duration-500"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-xs font-bold" style={{color:col(pct)}}>{pct.toFixed(0)}%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-[#6888aa] mt-0.5 truncate max-w-[110px]">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Xray status */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className={running ? 'text-green-400' : 'text-red-400'}/>
            <span className="font-semibold text-sm">Xray</span>
            {xray?.version && (
              <span className="font-mono text-xs bg-[#111a2b] border border-[#254060] px-2 py-0.5 rounded text-[#6888aa]">
                v{xray.version}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded ${running ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {running ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => act(restartXray, 'restart')} disabled={!!acting}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 disabled:opacity-40">
            <RefreshCw size={12} className={acting==='restart'?'animate-spin':''}/> รีสตาร์ท
          </button>
          <button onClick={() => act(stopXray, 'stop')} disabled={!!acting}
            className="btn-danger flex items-center gap-1.5 text-xs py-1.5 disabled:opacity-40">
            <Square size={12}/> หยุด
          </button>
          <button onClick={() => act(startXray, 'start')} disabled={!!acting}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 disabled:opacity-40">
            <Play size={12}/> เริ่ม
          </button>
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* uptime */}
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-[#6888aa] text-xs uppercase tracking-wide mb-3">
            <Clock size={13}/> Uptime
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#6888aa] text-xs">Xray</span>
              <span className="font-mono text-[#00d4c8] text-xs">{status?.xrayRunning !== false && xray?.state === 'running' ? fmt(status?.uptime ?? 0) : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6888aa] text-xs">System</span>
              <span className="font-mono text-xs">{status?.uptime ? fmt(status.uptime) : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6888aa] text-xs">Load</span>
              <span className="font-mono text-xs">{status?.loads?.slice(0,3).map((l:number)=>l.toFixed(2)).join(' | ') ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* speed */}
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-[#6888aa] text-xs uppercase tracking-wide mb-3">
            <Wifi size={13}/> Overall Speed
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">Upload ↑</span>
              <span className="font-mono text-green-400 text-xs">{status?.netIO ? formatBytes(status.netIO.up)+'/s' : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">Download ↓</span>
              <span className="font-mono text-blue-400 text-xs">{status?.netIO ? formatBytes(status.netIO.down)+'/s' : '—'}</span>
            </div>
          </div>
        </div>

        {/* total traffic */}
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-[#6888aa] text-xs uppercase tracking-wide mb-3">
            <HardDrive size={13}/> Total Data
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">Sent</span>
              <span className="font-mono text-green-400 text-xs">{status?.netTraffic ? formatBytes(status.netTraffic.sent) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">Received</span>
              <span className="font-mono text-blue-400 text-xs">{status?.netTraffic ? formatBytes(status.netTraffic.recv) : '—'}</span>
            </div>
          </div>
        </div>

        {/* connection */}
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-[#6888aa] text-xs uppercase tracking-wide mb-3">
            <Network size={13}/> Connection Stats
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">TCP</span>
              <span className="font-mono text-[#00d4c8] text-xs">{status?.tcpCount ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">UDP</span>
              <span className="font-mono text-purple-400 text-xs">{status?.udpCount ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* IP addresses */}
      {status && (
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-[#6888aa] text-xs uppercase tracking-wide mb-3">
            <Globe size={13}/> IP Addresses
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">IPv4</span>
              <span className="font-mono text-xs text-[#00d4c8]">{status?.publicIP?.ipv4 || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6888aa] text-xs">IPv6</span>
              <span className="font-mono text-xs text-[#6888aa]">{status?.publicIP?.ipv6 || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
