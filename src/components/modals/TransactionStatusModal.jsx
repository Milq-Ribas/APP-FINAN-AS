import React from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
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
      <section className="modal-card status-card">
        <div className="modal-header">
          <h2>Status do Lançamento</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="close-btn">
            <X size={22} />
          </button>
        </div>

        <div className="status-summary">
          <strong>{transaction.description}</strong>
          <span>{formatMoney(transaction.amount, isPrivate)}</span>
          <small>Status atual: {currentState.label}</small>
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
            {isIncome ? 'Recebido' : 'Pago'}
          </button>

          <button
            type="button"
            className={`status-action-button negative ${transaction.status === 'pending' ? 'selected' : ''}`}
            onClick={() => onUpdateStatus(transaction.id, 'pending')}
          >
            {isIncome ? 'Não recebi' : 'Não paguei'}
          </button>
        </div>

        <div className="status-secondary-actions">
          <button type="button" onClick={() => onEdit(transaction)}>
            <Pencil size={17} />
            Editar
          </button>

          <button type="button" className="delete-secondary" onClick={() => onDelete(transaction)}>
            <Trash2 size={17} />
            Excluir
          </button>
        </div>
      </section>
    </div>
  )
}
