import React from 'react'
import { ChevronLeft, Download, LogOut, Trash2, Eye, EyeOff, ShieldCheck, Smartphone } from 'lucide-react'

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
      <section className="modal-card ref-modal-card profile-card">
        <div className="ref-modal-banner">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="ref-back-circle-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="ref-modal-banner-title">Meu Perfil</h2>
          <div style={{ width: '38px' }} />
        </div>

        <div className="ref-modal-body profile-modal-body">
          {/* Card do Usuário */}
          <div className="profile-user-badge">
            <div className="profile-avatar">
              <ShieldCheck size={24} />
            </div>
            <div className="profile-user-info">
              <p className="profile-label">Conectado como</p>
              <strong className="profile-email-clean">{email}</strong>
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
              <div className="setting-icon-box">
                {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
              <div>
                <strong>Modo Privacidade</strong>
                <small>Ocultar valores e saldos na tela</small>
              </div>
            </div>
            <span className={`toggle-pill ${isPrivate ? 'active' : ''}`}>
              {isPrivate ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {/* Ações Rápidas do Perfil */}
          <div className="profile-actions-group">
            <button type="button" className="profile-action-btn" onClick={exportToCSV}>
              <Download size={18} />
              <span>Exportar Planilha (CSV)</span>
            </button>

            <button type="button" className="profile-action-btn" onClick={installApp}>
              <Smartphone size={18} />
              <span>Instalar Aplicativo (PWA)</span>
            </button>
          </div>

          {installMessage && <p className="install-message">{installMessage}</p>}

          <button type="button" className="ref-white-submit-btn profile-logout-btn" onClick={signOut}>
            <LogOut size={18} />
            <span>Sair da conta</span>
          </button>

          {/* Zona de Perigo */}
          <div className="profile-danger-zone">
            <span className="danger-zone-title">Zona de Perigo</span>
            <button
              type="button"
              className="profile-danger-btn"
              onClick={deleteAllTransactions}
            >
              <Trash2 size={17} />
              <span>Zerar todos os lançamentos</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
