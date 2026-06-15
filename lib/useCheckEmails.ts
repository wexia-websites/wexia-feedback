'use client'

import { useState, useCallback } from 'react'
import { useFeedback } from './feedback-context'

export function useCheckEmails() {
  const { refresh } = useFeedback()
  const [checkingEmails, setCheckingEmails] = useState(false)
  const [checkResult, setCheckResult] = useState<string | null>(null)

  const checkEmails = useCallback(async () => {
    if (checkingEmails) return
    setCheckingEmails(true)
    setCheckResult(null)
    try {
      const res = await fetch('/api/check-emails', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCheckResult(`Chyba: ${json.error ?? 'Neznámá chyba'}`)
      } else {
        setCheckResult(json.processed > 0
          ? `Načteno ${json.processed} nových odpovědí.`
          : 'Žádné nové odpovědi.')
        await refresh()
      }
    } catch {
      setCheckResult('Síťová chyba.')
    }
    setCheckingEmails(false)
  }, [refresh, checkingEmails])

  return { checkEmails, checkingEmails, checkResult }
}
