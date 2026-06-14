'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const correct = process.env.NEXT_PUBLIC_FEEDBACK_PASSWORD || 'wexia2026'
    if (password === correct) {
      sessionStorage.setItem('feedback_auth', 'true')
      router.push('/dashboard')
    } else {
      setError('Špatné heslo. Zkus to znovu.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">✦</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4, marginTop: 10 }}>
          Feedback Admin
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
          AI Laboratoř — správa feedbacků
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
              Heslo
            </label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Zadej heslo..."
              autoFocus
            />
          </div>

          {error && (
            <div className="error-banner">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
          >
            Přihlásit se →
          </button>
        </form>
      </div>
    </div>
  )
}
