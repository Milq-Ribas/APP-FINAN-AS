import React from 'react'
import { Check } from 'lucide-react'
import { getCategoryIcon } from '../constants/categories'
import { formatMoney, getInstallmentsLabel, getTransactionState } from '../utils/formatters'

export function TransactionItem({ item, onClick, onToggleStatus, isPrivate = false }) {
  const state = getTransactionState(item)
  const isPaid = item.status === 'paid'

  return (
    <article
      className={`transaction-item ${state.className}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
    >
      <div className="transaction-info">
        <strong>{item.description}</strong>
        <span>
          {getCategoryIcon(item.category)} {getInstallmentsLabel(item)}
        </span>
      </div>

      <div className="transaction-right">
        <div className="transaction-value">
          <strong>{formatMoney(item.amount, isPrivate)}</strong>
          <span>{state.label}</span>
        </div>
        <button
          type="button"
          className={`quick-status-btn ${isPaid ? 'is-paid' : 'is-pending'}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStatus(item.id, isPaid ? 'pending' : 'paid')
          }}
          title={isPaid ? 'Marcar como a pagar/receber' : 'Marcar como pago/recebido'}
          aria-label={isPaid ? 'Marcar como pendente' : 'Marcar como concluído'}
        >
          <Check size={14} />
        </button>
      </div>
    </article>
  )
}
