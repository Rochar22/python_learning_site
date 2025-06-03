import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
const inter = Inter({ subsets: ["latin", "cyrillic"] })
import { AuthProvider } from '@/auth/authContext';
import { Navbar } from "@/components/navbar"

export const metadata = {
  title: "Платформа для изучения Python",
  description: "Интерактивная платформа для изучения Python с задачами разной сложности",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
        <Navbar />
          {children}
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'