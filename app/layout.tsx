import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] })

export const metadata: Metadata = {
  title: 'NeuralClose — Dashboard',
  description: "Your smartest salesperson never sleeps.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} ${outfit.variable}`}>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden pl-60">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
