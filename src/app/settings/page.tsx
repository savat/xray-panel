'use client'
import { useEffect, useState } from 'react'
import { getSettings, updateSettings, changePass } from '@/lib/api'
import { Copy, Check, Bot, Bell, Shield, Globe } from 'lucide-react'

type Tab = 'panel' | 'tgbot' | 'sub' | 'password'

export default function SettingsPage() {
  const [tab,      setTab]      = useState<Tab>('panel')
  const [settings, setSettings] = useState<any>(null)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [copied,   setCopied]   = useState('')

  // password
  const [oldPass,  setOldPass]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [conPass,  setConPass]  = useState('')
  const [passMsg,  setPassMsg]  = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [passLoad, setPassLoad] = useState(false)

  useEffect(() => {
    getSettings().then(r => setSettings(r.obj)).catch(() => {})
  }, [])

  const set = (k: string, v: any) => setSettings((p: any) => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setMsg('')
    try { await updateSettings(settings); setMsg('บันทึกสำเร็จ') }
    catch { setMsg('บันทึกล้มเหลว') }
    finally { setSaving(false) }
  }

  const submitPass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== conPass) { setPassErr('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    setPassLoad(true); setPassErr(''); setPassMsg('')
    try { await changePass(oldPass, newPass); setPassMsg('เปลี่ยนรหัสผ่านสำเร็จ'); setOldPass(''); setNewPass(''); setConPass('') }
    catch (err: any) { setPassErr(err?.response?.data?.msg || 'เกิดข้อผิดพลาด') }
    finally { setPassLoad(false) }
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  // Sub URL base
  const subBase = typeof window !== 'undefined'
    ? `${window.location.origin}/api/proxy/sub`
    : ''

  const TABS = [
    { key:'panel',    label:'แผงควบคุม',  icon:<Globe size={14}/> },
    { key:'tgbot',    label:'Telegram',   icon:<Bot size={14}/> },
    { key:'sub',      label:'Subscription', icon:<Bell size={14}/> },
    { key:'password', label:'รหัสผ่าน',  icon:<Shield size={14}/> },
  ]

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-lg md:text-xl font-semibold">ตั้งค่า</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d1420] border border-[#1e3050] rounded-lg p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              tab === t.key ? 'bg-[#00d4c8] text-[#080c12]' : 'text-[#6888aa] hover:text-[#c8daf0]'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Panel settings */}
      {tab === 'panel' && settings && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-[#c8daf0]">ตั้งค่าแผงควบคุม</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Port</label>
              <input className="input" type="number" value={settings.webPort??''} onChange={e=>set('webPort',+e.target.value)}/>
            </div>
            <div>
              <label className="label">Session (นาที)</label>
              <input className="input" type="number" value={settings.sessionMaxAge??''} onChange={e=>set('sessionMaxAge',+e.target.value)}/>
            </div>
          </div>
          <div>
            <label className="label">Web Base Path</label>
            <input className="input font-mono" value={settings.webBasePath??''} onChange={e=>set('webBasePath',e.target.value)}/>
          </div>
          <div>
            <label className="label">Page Size</label>
            <input className="input" type="number" value={settings.pageSize??''} onChange={e=>set('pageSize',+e.target.value)}/>
          </div>
          {msg && <Msg text={msg}/>}
          <button onClick={save} disabled={saving} className="btn-cyan w-full disabled:opacity-40">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      )}

      {/* Telegram Bot */}
      {tab === 'tgbot' && settings && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-[#c8daf0]">Telegram Bot</h2>
          <p className="text-xs text-[#6888aa]">รับแจ้งเตือนและจัดการผ่าน Telegram</p>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="tg-enable" checked={!!settings.tgBotEnable}
              onChange={e => set('tgBotEnable', e.target.checked)} className="w-4 h-4 accent-[#00d4c8]"/>
            <label htmlFor="tg-enable" className="text-sm">เปิดใช้งาน Telegram Bot</label>
          </div>

          <div>
            <label className="label">Bot Token</label>
            <input className="input font-mono text-sm" value={settings.tgBotToken??''}
              onChange={e => set('tgBotToken', e.target.value)} placeholder="123456789:AAF..."/>
            <p className="text-xs text-[#6888aa] mt-1">ขอ token จาก @BotFather บน Telegram</p>
          </div>

          <div>
            <label className="label">Admin Chat ID</label>
            <input className="input font-mono text-sm" value={settings.tgBotChatId??''}
              onChange={e => set('tgBotChatId', e.target.value)} placeholder="123456789"/>
            <p className="text-xs text-[#6888aa] mt-1">ดู Chat ID จาก @userinfobot</p>
          </div>

          <div>
            <label className="label">Proxy (ถ้าจำเป็น)</label>
            <input className="input font-mono text-sm" value={settings.tgBotProxy??''}
              onChange={e => set('tgBotProxy', e.target.value)} placeholder="socks5://127.0.0.1:1080"/>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6888aa] uppercase tracking-wide">การแจ้งเตือน</p>
            {[
              { key:'tgRunLoginNotify',    label:'แจ้งเตือนเมื่อมีการ Login' },
              { key:'tgExpireNotify',      label:'แจ้งเตือนก่อน Client หมดอายุ' },
              { key:'tgTrafficNotify',     label:'แจ้งเตือนเมื่อ Traffic เต็ม' },
            ].map(({key,label}) => (
              <div key={key} className="flex items-center gap-2">
                <input type="checkbox" id={key} checked={!!settings[key]}
                  onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-[#00d4c8]"/>
                <label htmlFor={key} className="text-sm">{label}</label>
              </div>
            ))}
          </div>

          {msg && <Msg text={msg}/>}
          <button onClick={save} disabled={saving} className="btn-cyan w-full disabled:opacity-40">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      )}

      {/* Subscription */}
      {tab === 'sub' && settings && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-[#c8daf0]">Subscription URL</h2>
          <p className="text-xs text-[#6888aa]">
            Client แต่ละคนมี Sub URL เป็นของตัวเอง ใช้สำหรับ import ใน VPN app
          </p>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="sub-enable" checked={!!settings.subEnable}
              onChange={e => set('subEnable', e.target.checked)} className="w-4 h-4 accent-[#00d4c8]"/>
            <label htmlFor="sub-enable" className="text-sm">เปิดใช้งาน Subscription</label>
          </div>

          <div>
            <label className="label">Sub Port (ถ้าไม่ระบุ ใช้ port เดิม)</label>
            <input className="input" type="number" value={settings.subPort??''}
              onChange={e => set('subPort', e.target.value)} placeholder="ปล่อยว่าง = ใช้ port เดิม"/>
          </div>

          <div>
            <label className="label">Sub Path</label>
            <input className="input font-mono" value={settings.subPath??''}
              onChange={e => set('subPath', e.target.value)} placeholder="/sub"/>
          </div>

          <div>
            <label className="label">Sub Domain (ถ้ามี)</label>
            <input className="input font-mono" value={settings.subDomain??''}
              onChange={e => set('subDomain', e.target.value)} placeholder="sub.yourdomain.com"/>
          </div>

          {/* แสดงตัวอย่าง Sub URL */}
          <div className="bg-[#111a2b] border border-[#1e3050] rounded-lg p-3 space-y-2">
            <p className="text-xs text-[#6888aa] font-medium uppercase tracking-wide">ตัวอย่าง Sub URL</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs text-[#00d4c8] flex-1 break-all">
                {settings.subDomain
                  ? `https://${settings.subDomain}${settings.subPath||'/sub'}/CLIENT_SUBID`
                  : `${subBase}/CLIENT_SUBID`}
              </code>
              <button onClick={() => copy(
                settings.subDomain
                  ? `https://${settings.subDomain}${settings.subPath||'/sub'}/CLIENT_SUBID`
                  : `${subBase}/CLIENT_SUBID`,
                'sub-example'
              )} className="text-[#3a5070] hover:text-[#00d4c8] shrink-0">
                {copied==='sub-example' ? <Check size={13} className="text-green-400"/> : <Copy size={13}/>}
              </button>
            </div>
          </div>

          <div className="bg-[#0d1420] border border-[#254060] rounded-lg p-3 text-xs text-[#6888aa] space-y-1">
            <p className="font-medium text-[#c8daf0]">วิธีใช้งาน:</p>
            <p>1. เปิด Subscription ด้านบน</p>
            <p>2. Sub ID ของแต่ละ client อยู่ในข้อมูล client (subId field)</p>
            <p>3. URL รูปแบบ: <code className="text-[#00d4c8]">SERVER:PORT/sub/CLIENT_SUBID</code></p>
            <p>4. นำ URL ไป import ใน v2rayNG, Shadowrocket, Clash ได้เลย</p>
          </div>

          {msg && <Msg text={msg}/>}
          <button onClick={save} disabled={saving} className="btn-cyan w-full disabled:opacity-40">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      )}

      {/* Password */}
      {tab === 'password' && (
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-[#c8daf0] mb-4">เปลี่ยนรหัสผ่าน</h2>
          <form onSubmit={submitPass} className="space-y-4">
            <div>
              <label className="label">รหัสผ่านปัจจุบัน</label>
              <input className="input" type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} required/>
            </div>
            <div>
              <label className="label">รหัสผ่านใหม่</label>
              <input className="input" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required/>
            </div>
            <div>
              <label className="label">ยืนยันรหัสผ่านใหม่</label>
              <input className="input" type="password" value={conPass} onChange={e=>setConPass(e.target.value)} required/>
            </div>
            {passErr && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{passErr}</div>}
            {passMsg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-2 rounded-lg">{passMsg}</div>}
            <button type="submit" disabled={passLoad} className="btn-cyan w-full disabled:opacity-40">
              {passLoad ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Msg({ text }: { text: string }) {
  const ok = text.includes('สำเร็จ')
  return (
    <div className={`text-sm px-3 py-2 rounded-lg border ${ok
      ? 'bg-green-500/10 border-green-500/30 text-green-400'
      : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {text}
    </div>
  )
}
