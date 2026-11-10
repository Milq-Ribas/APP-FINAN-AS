import React from 'react'
import { Check, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { getCategoryIcon } from '../constants/categories'
import { getDayLabel } from '../utils/date'
import { formatSignedMoney, getInstallmentsLabel, getTransactionState } from '../utils/formatters'

export function TransactionItem({ item, onClick, onToggleStatus, isPrivate = false, showDate = false }) {
  const state = getTransactionState(item)
  const isPaid = item.status === 'paid'
  const isIncome = item.type === 'income'
  const installmentOrCategory = getInstallmentsLabel(item)

  return (
    <article
      className={`transaction-item ref-transaction-item ${isIncome ? 'is-income-card' : 'is-expense-card'} ${state.className}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
    >
      <div className="transaction-left">
        <div className={`tx-avatar-circle ${isIncome ? 'tx-income-circle' : 'tx-expense-circle'}`}>
          {isIncome ? <ArrowDownLeft size={18} strokeWidth={2.4} /> : <ArrowUpRight size={18} strokeWidth={2.4} />}
        </div>

        <div className="transaction-info">
          <strong>{item.description}</strong>
          <div className="tx-meta-line">
            <span className={`tx-cat-icon-inline ${isIncome ? 'cat-income' : 'cat-expense'}`}>
              {getCategoryIcon(item.category, { size: 12, strokeWidth: 2.2 })}
            </span>
            <span className="tx-meta-text">
              {item.category}
              {installmentOrCategory !== item.category ? ` • ${installmentOrCategory}` : ''}
            </span>
          </div>
          <small className="tx-sub-time">
            {showDate ? `${getDayLabel(item.due_date)} • ` : ''}
            <em className={`tx-status-inline ${state.className}`}>{state.label}</em>
          </small>
        </div>
      </div>

      <div className="transaction-right">
        <div className="transaction-value">
          <strong className={isIncome ? 'tx-amount-income' : 'tx-amount-expense'}>
            {formatSignedMoney(item.amount, item.type, isPrivate)}
          </strong>
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
          <Check size={14} strokeWidth={2.6} />
        </button>
      </div>
    </article>
  )
}
