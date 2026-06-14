import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import { FeedbackProvider } from '@/lib/feedback-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FeedbackProvider>
      <div className="app">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <main className="main">{children}</main>
      </div>
    </FeedbackProvider>
  )
}
