'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Server, Users, Settings, LogOut, Zap, Menu, X } from 'lucide-react'
import { logout } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV = [
  { href:'/dashboard', icon:LayoutDashboard, label:'แดชบอร์ด' },
  { href:'/inbounds',  icon:Server,          label:'Inbounds' },
  { href:'/clients',   icon:Users,           label:'Clients' },
  { href:'/settings',  icon:Settings,        label:'ตั้งค่า' },
]

export default function Sidebar() {
  const path    = usePathname()
  const router  = useRouter()
  const [open, setOpen] = useState(false)

  const doLogout = async () => {
    await logout().catch(()=>{})
    router.push('/login')
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV.map(({ href, icon:Icon, label }) => {
        const active = path.startsWith(href)
        return (
          <Link key={href} href={href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all',
              active
                ? 'bg-[rgba(0,212,200,.12)] text-[#00d4c8] border-l-2 border-[#00d4c8] pl-[10px]'
                : 'text-[#6888aa] hover:bg-[#162033] hover:text-[#c8daf0]'
            )}>
            <Icon size={16}/>
            <span>{label}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 min-h-screen flex-col bg-[#0d1420] border-r border-[#1e3050]">
        <div className="px-5 py-4 border-b border-[#1e3050] flex items-center gap-2">
          <Zap size={18} className="text-[#00d4c8]"/>
          <span className="font-mono font-bold tracking-widest text-[#00d4c8]"
            style={{textShadow:'0 0 16px rgba(0,212,200,.5)'}}>3X-UI</span>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          <NavLinks/>
        </nav>
        <div className="p-2 border-t border-[#1e3050]">
          <button onClick={doLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6888aa] hover:text-red-400 hover:bg-red-500/10 w-full transition-all">
            <LogOut size={15}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0d1420] border-b border-[#1e3050]">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-[#00d4c8]"/>
          <span className="font-mono font-bold text-[#00d4c8] tracking-widest text-sm">3X-UI</span>
        </div>
        <button onClick={() => setOpen(true)} className="text-[#6888aa] hover:text-[#c8daf0] p-1">
          <Menu size={22}/>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <div className="relative w-64 bg-[#0d1420] border-r border-[#1e3050] flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3050]">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#00d4c8]"/>
                <span className="font-mono font-bold text-[#00d4c8] tracking-widest">3X-UI</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#6888aa] hover:text-red-400">
                <X size={20}/>
              </button>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-0.5">
              <NavLinks onClick={() => setOpen(false)}/>
            </nav>
            <div className="p-2 border-t border-[#1e3050]">
              <button onClick={doLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-[#6888aa] hover:text-red-400 hover:bg-red-500/10 w-full transition-all">
                <LogOut size={15}/> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
