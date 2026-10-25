import React, { useState } from 'react'
import { X, Mail, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function ForgotPasswordModal({ onClose, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!email) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })

      if (error) {
        setErrorMessage(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao solicitar redefinição de senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>Recuperar Senha</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="close-btn">
            <X size={22} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>E-mail enviado!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
            </p>
            <button
              className="submit-button"
              onClick={onClose}
              style={{ marginTop: '20px' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
              Digite seu e-mail cadastrado para receber instruções de recuperação de senha.
            </p>

            <div className="form-group">
              <input
                placeholder="Seu e-mail"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="modern-input"
                autoFocus
              />
            </div>

            {errorMessage && (
              <p className="message" style={{ color: 'var(--danger-color)', fontSize: '0.88rem', marginBottom: '12px' }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Enviando link...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
