import React from 'react'
import { X, Download, LogOut, Trash2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export function ProfileModal({
  email,
  onClose,
  signOut,
  installApp,
  installMessage,
  deleteAllTransactions,
  exportToCSV,
  isPrivate,
  setIsPrivate
}) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal-card profile-card">
        <div className="modal-header">
          <h2>Meu Perfil</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="close-btn">
            <X size={22} />
          </button>
        </div>

        <div className="profile-user-badge">
          <div className="profile-avatar">
            <ShieldCheck size={28} />
          </div>
          <div className="profile-user-info">
            <p className="profile-label">Conectado como</p>
            <strong className="profile-email">{email}</strong>
          </div>
        </div>

        {/* Toggle Modo Privacidade */}
        <div
          className="profile-setting-item"
          onClick={() => setIsPrivate(prev => !prev)}
          role="button"
          tabIndex={0}
        >
          <div className="setting-left">
            {isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
            <div>
              <strong>Modo Privacidade</strong>
              <small>Ocultar valores e saldos na tela</small>
            </div>
          </div>
          <span className={`toggle-pill ${isPrivate ? 'active' : ''}`}>
            {isPrivate ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Ações */}
        <button className="install-button" onClick={exportToCSV} style={{ marginTop: '14px' }}>
          <Download size={18} />
          Exportar Excel (CSV)
        </button>

        <button className="install-button" onClick={installApp} style={{ marginTop: '10px' }}>
          <Download size={18} />
          Instalar Aplicativo (PWA)
        </button>

        {installMessage && <p className="install-message">{installMessage}</p>}

        <button className="submit-button" onClick={signOut} style={{ marginTop: '16px' }}>
          <LogOut size={18} style={{ marginRight: '8px' }} />
          Sair da conta
        </button>

        {/* Zona de Perigo */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <p className="profile-label" style={{ textAlign: 'center', color: 'var(--danger-color)' }}>
            Zona de Perigo
          </p>
          <button
            className="delete-following-btn"
            onClick={deleteAllTransactions}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Trash2 size={18} />
            Zerar todos os lançamentos
          </button>
        </div>
      </section>
    </div>
  )
}
