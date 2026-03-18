'use client'
import { useState } from 'react'
import { Copy, Check, QrCode } from 'lucide-react'

// QR popup
const QR = ({ text, onClose }: { text: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
    onClick={onClose}>
    <div className="bg-[#0d1420] border border-[#1e3050] rounded-xl p-5 flex flex-col items-center gap-3 max-w-xs w-full"
      onClick={e => e.stopPropagation()}>
      <p className="text-xs text-[#6888aa] text-center">Subscription URL</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}&bgcolor=0d1420&color=00d4c8&margin=10`}
        alt="QR" className="rounded-lg" width={220} height={220}/>
      <p className="font-mono text-xs text-[#6888aa] break-all text-center">{text}</p>
      <button onClick={onClose} className="btn-ghost text-sm w-full">ปิด</button>
    </div>
  </div>
)

export default function SubUrl({ subId }: { subId: string }) {
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  if (!subId) return null

  const url = `/api/proxy/sub/${subId}`
  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${url}`
    : url

  const copy = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {showQr && <QR text={fullUrl} onClose={() => setShowQr(false)}/>}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs text-[#6888aa] truncate max-w-[120px]">sub/{subId.slice(0,8)}...</span>
        <button onClick={copy} className="text-[#3a5070] hover:text-[#00d4c8] transition-colors" title="Copy Sub URL">
          {copied ? <Check size={12} className="text-green-400"/> : <Copy size={12}/>}
        </button>
        <button onClick={() => setShowQr(true)} className="text-[#3a5070] hover:text-[#00d4c8] transition-colors" title="QR Sub URL">
          <QrCode size={12}/>
        </button>
      </div>
    </>
  )
}
