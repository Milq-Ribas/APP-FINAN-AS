import React from 'react'
import { ChevronLeft, Bell, CheckCircle2, AlertCircle } from 'lucide-react'
import { getCategoryIcon } from '../../constants/categories'
import { today, addDays } from '../../utils/date'
import { formatMoney } from '../../utils/formatters'

export function NotificationsModal({ alerts, onClose, onOpenTransaction, isPrivate = false }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal-card ref-modal-card">
        <div className="ref-modal-banner">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="ref-back-circle-btn"
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>
          <h2 className="ref-modal-banner-title">Notificações e Vencimentos</h2>
          <div style={{ width: '36px' }} />
        </div>

        <div className="ref-modal-body">
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
            <div className="ref-tx-feed">
              {alerts.map(item => {
                const isOverdue = item.due_date < today
                const isTomorrow = item.due_date === addDays(today, 1)
                const label = isOverdue ? 'Atrasado' : isTomorrow ? 'Vence amanhã' : 'Vence hoje'
                const labelClass = isOverdue ? 'overdue' : 'expense-pending'

                return (
                  <article
                    className={`transaction-item ref-transaction-item ${labelClass}`}
                    key={item.id}
                    onClick={() => {
                      onOpenTransaction(item)
                      onClose()
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="transaction-left">
                      <div className="tx-avatar-circle tx-expense-circle">
                        {isOverdue ? (
                          <AlertCircle size={18} strokeWidth={2.2} />
                        ) : (
                          getCategoryIcon(item.category, { size: 17, strokeWidth: 2.2 })
                        )}
                      </div>
                      <div className="transaction-info">
                        <strong>{item.description}</strong>
                        <small className="tx-sub-time">
                          <em className={`tx-status-inline ${labelClass}`}>{label}</em> • {item.category}
                        </small>
                      </div>
                    </div>
                    <div className="transaction-value">
                      <strong className="tx-amount-expense">{formatMoney(item.amount, isPrivate)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
