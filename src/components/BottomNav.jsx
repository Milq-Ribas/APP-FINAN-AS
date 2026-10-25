import React from 'react'
import { BarChart3, ReceiptText, Plus, UserCircle, LogOut } from 'lucide-react'

export function BottomNav({ activeView, setView, openAdd, openProfile, signOut }) {
  return (
    <nav className="bottom-nav">
      <button
        className={activeView === 'home' ? 'active' : ''}
        onClick={() => setView('home')}
        aria-label="Painel Resumo"
      >
        <BarChart3 size={26} strokeWidth={2.4} />
      </button>

      <button
        className={activeView === 'transactions' ? 'active' : ''}
        onClick={() => setView('transactions')}
        aria-label="Lista de Transações"
      >
        <ReceiptText size={26} strokeWidth={2.4} />
      </button>

      <button
        className="add-button"
        onClick={() => openAdd('expense')}
        aria-label="Adicionar lançamento"
      >
        <Plus size={36} strokeWidth={3} />
      </button>

      <button
        onClick={openProfile}
        aria-label="Meu Perfil e Configurações"
      >
        <UserCircle size={26} strokeWidth={2.4} />
      </button>

      <button
        onClick={signOut}
        aria-label="Encerrar sessão"
        className="nav-logout-btn"
      >
        <LogOut size={26} strokeWidth={2.4} />
      </button>
    </nav>
  )
}
