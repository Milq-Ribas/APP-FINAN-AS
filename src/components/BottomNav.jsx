import React from 'react'
import { Home, ArrowUpDown, Plus, User } from 'lucide-react'

export function BottomNav({ activeView, setView, openAdd, openProfile }) {
  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav ref-floating-dock" aria-label="Navegação principal">
        <button
          type="button"
          className={`dock-item ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
          aria-label="Início"
        >
          <Home size={20} strokeWidth={2.5} className="dock-icon" />
          {activeView === 'home' && <span className="dock-label">Início</span>}
        </button>

        <button
          type="button"
          className={`dock-item ${activeView === 'transactions' ? 'active' : ''}`}
          onClick={() => setView('transactions')}
          aria-label="Extrato de Transações"
        >
          <ArrowUpDown size={20} strokeWidth={2.5} className="dock-icon" />
          {activeView === 'transactions' && <span className="dock-label">Extrato</span>}
        </button>

        <button
          type="button"
          className="dock-item dock-add-btn"
          onClick={() => openAdd('expense')}
          aria-label="Novo lançamento"
          title="Novo lançamento"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>

        <button
          type="button"
          className="dock-item"
          onClick={openProfile}
          aria-label="Meu Perfil e Configurações"
          title="Perfil"
        >
          <User size={20} strokeWidth={2.4} />
        </button>
      </nav>
    </div>
  )
}
