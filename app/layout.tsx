import type { Metadata } from 'next'
import { Fredoka, Geist, Geist_Mono } from 'next/font/google'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  weight: 'variable',
})

export const metadata: Metadata = {
  title: {
    default: 'osmdle',
    template: '%s · osmdle',
  },
  description: 'Which OpenStreetMap feature is more common? A higher/lower game.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="site-background flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
