import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <main className="main">{children}</main>
    </div>
  )
}
