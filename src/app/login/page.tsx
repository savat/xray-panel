'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await login(username, password)
      if (data.success) router.push('/dashboard')
      else setError(data.msg || 'เข้าสู่ระบบล้มเหลว')
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'เชื่อมต่อไม่ได้')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,200,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,200,.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px'
      }}/>
      {/* glow */}
      <div className="fixed pointer-events-none" style={{
        top:'-20%', left:'-10%', width:'600px', height:'600px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,212,200,.07) 0%,transparent 70%)'
      }}/>

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="card p-8 relative overflow-hidden" style={{
          backdropFilter:'blur(20px)',
          background:'rgba(13,20,32,.92)',
          boxShadow:'0 24px 80px rgba(0,0,0,.6),0 0 20px rgba(0,212,200,.1)'
        }}>
          {/* accent line */}
          <div className="absolute top-0 inset-x-0 h-0.5" style={{
            background:'linear-gradient(90deg,transparent,#00d4c8,transparent)'
          }}/>

          <div className="text-center mb-8">
            <div className="font-mono text-2xl font-bold mb-1">
              <span style={{color:'#00d4c8',textShadow:'0 0 20px rgba(0,212,200,.5)'}}>3X</span>
              <span className="text-white">-UI</span>
            </div>
            <p className="text-[#6888aa] text-sm">ระบบจัดการ Xray Proxy</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">ชื่อผู้ใช้</label>
              <input className="input" type="text" value={username}
                onChange={e=>setUsername(e.target.value)} placeholder="username" required autoFocus/>
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <input className="input" type="password" value={password}
                onChange={e=>setPassword(e.target.value)} placeholder="password" required/>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="btn-cyan w-full py-2.5 uppercase tracking-widest mt-2">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
