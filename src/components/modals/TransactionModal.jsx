import React from 'react'
import { ChevronLeft } from 'lucide-react'
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
        {/* Top Green Gradient Header (Reference Screen 2 Style) */}
        <div className="ref-modal-banner">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="ref-back-circle-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="ref-modal-banner-title">
            {isEditing
              ? 'Editar lançamento'
              : (isExpense ? 'Nova despesa' : 'Nova receita')}
          </h2>
          <div style={{ width: '38px' }} />
        </div>

        <div className="ref-modal-body">
          {/* Card Destinatário / Categoria & Tipo (estilo "Send to" da referência) */}
          <div className="ref-recipient-card">
            <div className="ref-recipient-top">
              <span className="ref-recipient-label">Tipo e Categoria</span>
              <div className="ref-type-pills">
                <button
                  type="button"
                  className={`ref-type-pill ${isExpense ? 'active-expense' : ''}`}
                  onClick={() => setForm({ ...form, type: 'expense' })}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  className={`ref-type-pill ${!isExpense ? 'active-income' : ''}`}
                  onClick={() => setForm({ ...form, type: 'income', installment_total: '1' })}
                >
                  Receita
                </button>
              </div>
            </div>

            <div className="ref-recipient-row">
              <div className="ref-category-avatar">
                <span>{getCategoryIcon(form.category)}</span>
              </div>
              <div className="ref-recipient-details">
                <input
                  placeholder={isExpense ? 'Descrição (ex: Aluguel, Mercado...)' : 'Descrição (ex: Salário, Freela...)'}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  className="ref-clean-desc-input"
                  autoFocus
                />
                <span className="ref-recipient-sub">{form.category}</span>
              </div>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="ref-change-pill-select"
                aria-label="Alterar categoria"
              >
                {categoryOptions.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hero Amount Display (estilo "2.300 BRL" centralizado da referência) */}
          <div className="ref-amount-hero-section">
            <div className="ref-amount-display">
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

          {/* Configurações de Data, Status e Parcelamento */}
          <div className="ref-config-panel">
            <div className="two-columns">
              <div className="form-group">
                <label className="form-label">Vencimento</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="modern-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="ref-status-toggle">
                  <button
                    type="button"
                    className={`ref-status-btn ${form.status === 'pending' ? 'active-pending' : ''}`}
                    onClick={() => setForm({ ...form, status: 'pending' })}
                  >
                    {isExpense ? 'A pagar' : 'A receber'}
                  </button>
                  <button
                    type="button"
                    className={`ref-status-btn ${form.status === 'paid' ? 'active-paid' : ''}`}
                    onClick={() => setForm({ ...form, status: 'paid' })}
                  >
                    {isExpense ? 'Pago' : 'Recebido'}
                  </button>
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="form-group" style={{ marginTop: '4px' }}>
                <label className="form-label">Repetição / Parcelamento</label>
                <div className="two-columns">
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
                    <option value="none">🔁 Único / Parcelado</option>
                    <option value="monthly">📅 Fixo Mensal</option>
                    <option value="weekly">🗓 Semanal</option>
                  </select>

                  {form.recurrence === 'none' ? (
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={form.installment_total}
                      onChange={e => setForm({ ...form, installment_total: e.target.value })}
                      placeholder="1x (À vista)"
                      title="Número de parcelas"
                      className="modern-input"
                    />
                  ) : (
                    <input
                      type="number"
                      min="2"
                      max="999"
                      value={form.repeat_count}
                      onChange={e => setForm({ ...form, repeat_count: e.target.value })}
                      placeholder="Qtd. repetições"
                      title="Quantas vezes repetir"
                      className="modern-input"
                    />
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

          {/* Botão Branco Estilo Pílula da Referência */}
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
