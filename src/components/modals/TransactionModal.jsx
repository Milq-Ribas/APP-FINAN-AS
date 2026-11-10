import React from 'react'
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2 } from 'lucide-react'
import { categoryOptions, getCategoryIcon } from '../../constants/categories'
import { formatMoney, roundMoney } from '../../utils/formatters'

export function TransactionModal({
  form,
  setForm,
  onSubmit,
  onClose,
  message,
  currentBalance = 0,
  isPrivate = false
}) {
  const isEditing = Boolean(form.id)
  const isExpense = form.type === 'expense'
  const installments = Math.max(1, Number(form.installment_total || 1))
  const rawAmount = Number(form.amount || 0)
  const installmentMode = form.installment_mode || 'installment'

  const previewPerInstallment = installments > 1 && rawAmount > 0
    ? (installmentMode === 'total' ? roundMoney(rawAmount / installments) : roundMoney(rawAmount))
    : roundMoney(rawAmount)

  const previewTotal = installments > 1 && rawAmount > 0
    ? (installmentMode === 'total' ? roundMoney(rawAmount) : roundMoney(rawAmount * installments))
    : roundMoney(rawAmount)

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-card ref-modal-card" onSubmit={onSubmit}>
        <div className={`ref-modal-banner ${isExpense ? 'banner-expense' : 'banner-income'}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="ref-back-circle-btn"
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>
          <h2 className="ref-modal-banner-title">
            {isEditing
              ? 'Editar lançamento'
              : (isExpense ? 'Nova despesa' : 'Nova receita')}
          </h2>
          <div style={{ width: '36px' }} />
        </div>

        <div className="ref-modal-body">
          {/* Segmented Control de Largura Total para Tipo (Despesa vs Receita) */}
          <div className="ref-type-segmented">
            <button
              type="button"
              className={`ref-type-pill ${isExpense ? 'active-expense' : ''}`}
              onClick={() => setForm({ ...form, type: 'expense' })}
            >
              <ArrowUpRight size={16} strokeWidth={2.4} />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              className={`ref-type-pill ${!isExpense ? 'active-income' : ''}`}
              onClick={() => setForm({ ...form, type: 'income', installment_total: '1' })}
            >
              <ArrowDownLeft size={16} strokeWidth={2.4} />
              <span>Receita</span>
            </button>
          </div>

          {/* Hero Amount Display */}
          <div className="ref-amount-hero-section">
            <span className="ref-amount-caption">Valor do lançamento</span>
            <div className="ref-amount-display">
              <span className={`ref-currency-prefix ${isExpense ? 'prefix-expense' : 'prefix-income'}`}>R$</span>
              <input
                placeholder="0,00"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
                className="ref-hero-amount-input"
              />
              <span className="ref-currency-tag">BRL</span>
            </div>
            <p className="ref-balance-hint">
              Saldo em conta: <strong className={currentBalance < 0 ? 'hint-neg' : 'hint-pos'}>{formatMoney(currentBalance, isPrivate)}</strong>
            </p>
          </div>

          {/* Card de Descrição e Categoria (100% responsivo, sem esmagar) */}
          <div className="ref-recipient-card">
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                placeholder={isExpense ? 'Ex: Aluguel, Mercado, Luz...' : 'Ex: Salário, Freela, Venda...'}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                className="modern-input ref-desc-field"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <div className="ref-category-select-row">
                <div className={`ref-category-avatar ${isExpense ? 'avatar-expense' : 'avatar-income'}`}>
                  {getCategoryIcon(form.category, { size: 18, strokeWidth: 2.2 })}
                </div>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="modern-select ref-full-cat-select"
                  aria-label="Selecionar categoria"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configurações de Status, Data e Parcelamento */}
          <div className="ref-config-panel">
            <div className="form-group">
              <label className="form-label">Status do pagamento</label>
              <div className="ref-status-toggle">
                <button
                  type="button"
                  className={`ref-status-btn ${form.status === 'pending' ? 'active-pending' : ''}`}
                  onClick={() => setForm({ ...form, status: 'pending' })}
                >
                  <Clock size={14} strokeWidth={2.3} />
                  <span>{isExpense ? 'A pagar' : 'A receber'}</span>
                </button>
                <button
                  type="button"
                  className={`ref-status-btn ${form.status === 'paid' ? 'active-paid' : ''}`}
                  onClick={() => setForm({ ...form, status: 'paid' })}
                >
                  <CheckCircle2 size={14} strokeWidth={2.3} />
                  <span>{isExpense ? 'Pago' : 'Recebido'}</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Data de vencimento</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="modern-input"
                required
              />
            </div>

            {!isEditing && (
              <div className="form-group">
                <label className="form-label">Repetição / Parcelamento</label>
                <div className="ref-recurrence-grid">
                  <select
                    value={form.recurrence}
                    onChange={e => setForm({
                      ...form,
                      recurrence: e.target.value,
                      installment_total: '1',
                      repeat_count: e.target.value === 'none' ? '1' : '12'
                    })}
                    className="modern-select"
                  >
                    <option value="none">Único / Parcelado</option>
                    <option value="monthly">Fixo Mensal</option>
                    <option value="weekly">Semanal</option>
                  </select>

                  {form.recurrence === 'none' ? (
                    <div className="ref-qty-input-wrap">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={form.installment_total}
                        onChange={e => setForm({ ...form, installment_total: e.target.value })}
                        placeholder="1"
                        title="Número de parcelas"
                        className="modern-input"
                      />
                      <span className="ref-qty-suffix">x</span>
                    </div>
                  ) : (
                    <div className="ref-qty-input-wrap">
                      <input
                        type="number"
                        min="2"
                        max="999"
                        value={form.repeat_count}
                        onChange={e => setForm({ ...form, repeat_count: e.target.value })}
                        placeholder="12"
                        title="Quantas vezes repetir"
                        className="modern-input"
                      />
                      <span className="ref-qty-suffix">vezes</span>
                    </div>
                  )}
                </div>

                {form.recurrence === 'none' && installments > 1 && (
                  <div className="installment-helper-box">
                    <div className="installment-mode-switch">
                      <button
                        type="button"
                        className={installmentMode === 'installment' ? 'active' : ''}
                        onClick={() => setForm({ ...form, installment_mode: 'installment' })}
                      >
                        Valor é da parcela
                      </button>
                      <button
                        type="button"
                        className={installmentMode === 'total' ? 'active' : ''}
                        onClick={() => setForm({ ...form, installment_mode: 'total' })}
                      >
                        Dividir valor total
                      </button>
                    </div>
                    {rawAmount > 0 && (
                      <small className="installment-preview-text">
                        Serão criadas <strong>{installments}x de {formatMoney(previewPerInstallment)}</strong> (Total: {formatMoney(previewTotal)})
                      </small>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="ref-white-submit-btn"
            type="submit"
          >
            {isEditing
              ? 'Salvar alterações'
              : (isExpense ? 'Confirmar despesa' : 'Confirmar receita')}
          </button>

          {message && (
            <div className={`toast-alert ${message.includes('sucesso') ? 'toast-success' : 'toast-error'}`}>
              <span>{message}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
