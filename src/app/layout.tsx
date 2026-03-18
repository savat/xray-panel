import type { Metadata } from 'next'
import { Noto_Sans_Thai, Space_Mono } from 'next/font/google'
import './globals.css'

const sans = Noto_Sans_Thai({ subsets:['thai','latin'], weight:['300','400','500','600','700'], variable:'--font-sans' })
const mono = Space_Mono({ subsets:['latin'], weight:['400','700'], variable:'--font-mono' })

export const metadata: Metadata = { title: '3x-ui Panel', description: 'ระบบจัดการ Xray Proxy' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sans.variable} ${mono.variable} font-sans bg-[#080c12] text-[#c8daf0] antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
