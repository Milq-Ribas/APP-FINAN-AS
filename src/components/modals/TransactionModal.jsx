import React from 'react'
import { X } from 'lucide-react'
import { categoryOptions } from '../../constants/categories'

export function TransactionModal({ form, setForm, onSubmit, onClose, message }) {
  const isEditing = Boolean(form.id)
  const isExpense = form.type === 'expense'

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-card modern-modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <span className="modal-subtitle">{isEditing ? 'EDITAR LANÇAMENTO' : 'NOVO LANÇAMENTO'}</span>
            <h2>{isEditing ? 'Atualizar Dados' : (isExpense ? 'Nova Despesa 💸' : 'Nova Receita 💰')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Segmented Control para Tipo */}
        <div className="segmented-control type-segmented">
          <button
            type="button"
            className={`segmented-option expense-opt ${form.type === 'expense' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, type: 'expense' })}
          >
            <span>💸 Despesa</span>
          </button>
          <button
            type="button"
            className={`segmented-option income-opt ${form.type === 'income' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, type: 'income' })}
          >
            <span>💰 Receita</span>
          </button>
        </div>

        {/* Descrição */}
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <input
            placeholder="Ex: Aluguel, Mercado, Salário..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
            className="modern-input"
            autoFocus
          />
        </div>

        {/* Valor Hero Input */}
        <div className="form-group">
          <label className="form-label">Valor do Lançamento</label>
          <div className="amount-input-wrapper">
            <span className="currency-symbol">R$</span>
            <input
              placeholder="0,00"
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
              className="amount-input"
            />
          </div>
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label">Status do Pagamento</label>
          <div className="segmented-control status-segmented">
            <button
              type="button"
              className={`segmented-option status-pending ${form.status === 'pending' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, status: 'pending' })}
            >
              <span>⏳ {form.type === 'income' ? 'A Receber' : 'A Pagar'}</span>
            </button>
            <button
              type="button"
              className={`segmented-option status-paid ${form.status === 'paid' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, status: 'paid' })}
            >
              <span>✅ {form.type === 'income' ? 'Recebido' : 'Pago'}</span>
            </button>
          </div>
        </div>

        {/* Categoria e Vencimento */}
        <div className="form-group">
          <label className="form-label">Categoria e Vencimento</label>
          <div className="two-columns">
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="modern-select"
            >
              {categoryOptions.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              className="modern-input"
              required
            />
          </div>
        </div>

        {/* Repetição / Parcelas */}
        {!isEditing && (
          <div className="form-group">
            <label className="form-label">Repetição / Parcelamento</label>
            <select
              value={form.recurrence}
              onChange={e => setForm({ ...form, recurrence: e.target.value, installment_total: '1', repeat_count: '2' })}
              className="modern-select"
            >
              <option value="none">🔁 À Vista / Único</option>
              <option value="weekly">🗓 Recorrente Semanal</option>
              <option value="monthly">📅 Recorrente Mensal</option>
            </select>

            {(form.recurrence === 'monthly' || form.recurrence === 'weekly') && (
              <div style={{ marginTop: '10px' }}>
                <label className="form-label">Quantas vezes?</label>
                <input
                  type="number"
                  min="2"
                  max="999"
                  value={form.repeat_count}
                  onChange={e => setForm({ ...form, repeat_count: e.target.value })}
                  placeholder="Ex: 12 (1 ano)"
                  className="modern-input"
                />
              </div>
            )}

            {form.recurrence === 'none' && (
              <div style={{ marginTop: '10px' }}>
                <label className="form-label">Número de Parcelas no Cartão</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={form.installment_total}
                  onChange={e => setForm({ ...form, installment_total: e.target.value })}
                  placeholder="1 = À vista"
                  className="modern-input"
                />
              </div>
            )}
          </div>
        )}

        {/* Botão de Envio */}
        <button
          className={`submit-button action-btn ${isExpense ? 'btn-expense' : 'btn-income'}`}
          type="submit"
        >
          {isEditing ? 'Salvar Alterações' : (isExpense ? 'Adicionar Despesa' : 'Adicionar Receita')}
        </button>

        {/* Toast Alert */}
        {message && (
          <div className={`toast-alert ${message.includes('sucesso') ? 'toast-success' : 'toast-error'}`}>
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  )
}
