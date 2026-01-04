import './globals.css'
import type { Metadata } from 'next'
import { Inter, Mountains_of_Christmas } from 'next/font/google'
import Snowfall from '@/components/Snowfall'
import Navbar from '@/components/Navbar'

const inter = Inter({ "subsets": ['latin'], "variable": '--font-inter' })
const christmas = Mountains_of_Christmas({ 
  weight: ['400', '700'], 
  subsets: ['latin'],
  variable: '--font-christmas'
})

export const metadata: Metadata = {
  title: 'Christmas Advent Calendar',
  description: 'A festive way to count down to Christmas with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${christmas.variable} font-sans bg-slate-50 text-slate-900 min-h-screen`}>
        <Snowfall />
        <Navbar />
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}