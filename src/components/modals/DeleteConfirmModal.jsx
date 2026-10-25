import React from 'react'
import { X, Trash2 } from 'lucide-react'

export function DeleteConfirmModal({ transaction, onClose, onDeleteOnly, onDeleteFollowing }) {
  const hasGroup = Boolean(transaction.recurrence_group_id)

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal-card delete-confirm-card">
        <div className="modal-header">
          <h2>Excluir lançamento</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="close-btn">
            <X size={22} />
          </button>
        </div>

        <div className="delete-confirm-body">
          <div className="delete-icon-circle">
            <Trash2 size={32} className="delete-icon" />
          </div>
          <p className="delete-confirm-desc">
            <strong>{transaction.description}</strong>
          </p>
          <p className="delete-confirm-sub">
            {hasGroup
              ? 'Esta transação faz parte de uma série/parcelamento. Como deseja excluir?'
              : 'Tem certeza que deseja excluir esta transação?'}
          </p>
        </div>

        <div className="delete-confirm-actions">
          <button
            type="button"
            className="delete-only-btn"
            onClick={() => onDeleteOnly(transaction)}
          >
            Apagar somente essa
          </button>

          {hasGroup && (
            <button
              type="button"
              className="delete-following-btn"
              onClick={() => onDeleteFollowing(transaction)}
            >
              Essa e as seguintes
            </button>
          )}

          <button type="button" className="cancel-delete-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
