import React from 'react'
import { ChevronLeft, Pencil, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { getCategoryIcon } from '../../constants/categories'
import { formatMoney, getTransactionState } from '../../utils/formatters'

export function TransactionStatusModal({
  transaction,
  onClose,
  onUpdateStatus,
  onEdit,
  onDelete,
  isPrivate = false
}) {
  const isIncome = transaction.type === 'income'
  const currentState = getTransactionState(transaction)

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal-card ref-modal-card status-card">
        <div className="ref-modal-banner">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="ref-back-circle-btn"
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>
          <h2 className="ref-modal-banner-title">Detalhes do Lançamento</h2>
          <div style={{ width: '36px' }} />
        </div>

        <div className="ref-modal-body">
          <div className="status-summary">
            <div className="ref-category-avatar" style={{ marginBottom: '4px' }}>
              {getCategoryIcon(transaction.category, { size: 20, strokeWidth: 2.2 })}
            </div>
            <strong>{transaction.description}</strong>
            <span>{formatMoney(transaction.amount, isPrivate)}</span>
            <small>{transaction.category} • {currentState.label}</small>
          </div>

          <p className="status-question">
            {isIncome ? 'Esse valor já foi recebido?' : 'Esse valor já foi pago?'}
          </p>

          <div className="status-actions-grid">
            <button
              type="button"
              className={`status-action-button positive ${transaction.status === 'paid' ? 'selected' : ''}`}
              onClick={() => onUpdateStatus(transaction.id, 'paid')}
            >
              <CheckCircle2 size={17} strokeWidth={2.3} />
              <span>{isIncome ? 'Recebido' : 'Pago'}</span>
            </button>

            <button
              type="button"
              className={`status-action-button negative ${transaction.status === 'pending' ? 'selected' : ''}`}
              onClick={() => onUpdateStatus(transaction.id, 'pending')}
            >
              <Clock size={17} strokeWidth={2.3} />
              <span>{isIncome ? 'A receber' : 'A pagar'}</span>
            </button>
          </div>

          <div className="status-secondary-actions">
            <button type="button" onClick={() => onEdit(transaction)}>
              <Pencil size={16} strokeWidth={2.2} />
              <span>Editar</span>
            </button>

            <button type="button" className="delete-secondary" onClick={() => onDelete(transaction)}>
              <Trash2 size={16} strokeWidth={2.2} />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
