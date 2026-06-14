'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type Note = { author: string; at: string; text: string }

export type FeedbackItem = {
  id: string
  user_id: string | null
  user_email: string | null
  category: string | null
  comment: string | null
  element_selector: string | null
  element_html: string | null
  screenshot: string | null
  screenshot_mime: string | null
  screenshot_url: string | null
  url: string | null
  user_agent: string | null
  timestamp: string | null
  status: string | null
  source_app: string | null
  notes: Note[]
}

type FeedbackContextValue = {
  reports: FeedbackItem[]
  loading: boolean
  error: string | null
  updateStatus: (id: string, status: string) => Promise<void>
  addNote: (id: string, note: Note) => Promise<void>
  refresh: () => Promise<void>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('feedback')
      .select('*')
      .order('timestamp', { ascending: false })
    console.log('PROVIDER FETCH spuštěn, počet reportů:', data?.length, err ? 'ERROR:' + err.message : '')
    if (err) { setError(err.message); return }
    setReports((data ?? []).map(r => ({ ...r, notes: r.notes ?? [] })))
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const updateStatus = useCallback(async (id: string, status: string) => {
    console.log('STATUS UPDATE start:', id, '→', status)
    // Optimistic update
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setError(null)

    const { data, error: err } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id)
      .select('id, status')

    console.log('STATUS UPDATE response:', { data, error: err })

    const check = await supabase.from('feedback').select('id, status').eq('id', id).maybeSingle()
    console.log('STATUS CHECK po update:', check.data, check.error)

    if (err) {
      // Rollback
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: r.status } : r))
      setError(`Chyba při uložení stavu: ${err.message}`)
      await load()
    }
  }, [load])

  const addNote = useCallback(async (id: string, note: Note) => {
    const target = reports.find(r => r.id === id)
    if (!target) return

    const notes = [...(target.notes ?? []), note]

    // Optimistic update
    setReports(prev => prev.map(r => r.id === id ? { ...r, notes } : r))
    setError(null)

    const { error: err } = await supabase
      .from('feedback')
      .update({ notes })
      .eq('id', id)

    if (err) {
      // Rollback
      setReports(prev => prev.map(r => r.id === id ? { ...r, notes: target.notes } : r))
      setError(`Chyba při uložení poznámky: ${err.message}`)
    }
  }, [reports])

  return (
    <FeedbackContext.Provider value={{ reports, loading, error, updateStatus, addNote, refresh }}>
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider')
  return ctx
}
