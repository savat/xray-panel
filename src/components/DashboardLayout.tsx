import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar/>
      {/* pt-14 บนมือถือเพื่อเว้น top bar */}
      <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}
