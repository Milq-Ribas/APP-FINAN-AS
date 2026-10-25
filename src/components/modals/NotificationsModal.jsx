import React from 'react'
import { X, Bell, CheckCircle2 } from 'lucide-react'
import { today, addDays } from '../../utils/date'
import { formatMoney } from '../../utils/formatters'

export function NotificationsModal({ alerts, onClose, onOpenTransaction, isPrivate = false }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} style={{ color: 'var(--warning-color)' }} />
            <h2>Notificações</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="close-btn">
            <X size={22} />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
            <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Tudo em dia!
            </strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Nenhuma conta próxima do vencimento pendente de pagamento.
            </p>
          </div>
        ) : (
          <div className="date-items">
            {alerts.map(item => {
              const isOverdue = item.due_date < today
              const isTomorrow = item.due_date === addDays(today, 1)
              const label = isOverdue ? 'Atrasado' : isTomorrow ? 'Vence amanhã' : 'Vence hoje'
              const labelClass = isOverdue ? 'overdue' : 'expense-pending'

              return (
                <article
                  className={`transaction-item ${labelClass}`}
                  key={item.id}
                  onClick={() => {
                    onOpenTransaction(item)
                    onClose()
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="transaction-info">
                    <strong>{item.description}</strong>
                    <span>{label}</span>
                  </div>
                  <div className="transaction-value">
                    <strong>{formatMoney(item.amount, isPrivate)}</strong>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
