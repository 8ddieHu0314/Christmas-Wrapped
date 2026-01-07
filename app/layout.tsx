import './globals.css'
import type { Metadata } from 'next'
import { Inter, Mountains_of_Christmas } from 'next/font/google'
import ClientLayout from './client-layout'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const christmas = Mountains_of_Christmas({ 
  weight: ['400', '700'], 
  subsets: ['latin'],
  variable: '--font-christmas'
})

export const metadata: Metadata = {
  title: 'Christmas Wrapped',
  description: 'Discover what your friends think of you with a festive advent calendar!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${christmas.variable} font-sans min-h-screen`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
