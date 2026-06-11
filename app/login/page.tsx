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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              Feedback Admin
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
              AI Laboratoř — správa feedbacků
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                Heslo
              </label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Zadej heslo..."
                style={{ width: '100%', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: 14,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15 }}
            >
              Přihlásit se →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
