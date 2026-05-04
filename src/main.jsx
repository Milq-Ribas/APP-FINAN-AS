import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import { BarChart3, ReceiptText, Plus, UserCircle, LogOut, ChevronDown, X } from 'lucide-react'
import './style.css'

const today = new Date().toISOString().slice(0, 10)
const currentMonth = new Date().toISOString().slice(0, 7)

const initialForm = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Moradia',
  person: 'Casal',
  due_date: today,
  status: 'pending',
  recurrence: 'none',
  repeat_months: '6'
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function addMonths(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1 + amount, day)
  return date.toISOString().slice(0, 10)
}

function getMonthLabel(monthValue) {
  const [, month] = monthValue.split('-').map(Number)
  return monthNames[month - 1] || 'Mês'
}

function getDayLabel(dateString) {
  const [, month, day] = dateString.split('-').map(Number)
  return `${day} de ${monthNames[month - 1]}`
}

function getInstallmentsLabel(item) {
  if (item.recurrence === 'monthly') return 'RECORRENTE'
  return item.category?.toUpperCase() || 'LANÇAMENTO'
}

function getTransactionState(item) {
  const isIncome = item.type === 'income'
  const isPaid = item.status === 'paid'
  const isOverdue = !isPaid && item.due_date < today

  if (isOverdue) return { label: 'ATRASADO', className: 'overdue' }
  if (isPaid && isIncome) return { label: 'RECEBIDO', className: 'paid' }
  if (isPaid) return { label: 'PAGO', className: 'paid' }
  if (isIncome) return { label: 'A RECEBER', className: 'income-pending' }
  return { label: 'A PAGAR', className: 'expense-pending' }
}

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(initialForm)
  const [monthFilter, setMonthFilter] = useState(currentMonth)
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [view, setView] = useState('home')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) fetchTransactions()
  }, [session])

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('due_date', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setTransactions(data || [])
  }

  async function signUp() {
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Cadastro criado. Agora faça login.')
  }

  async function signIn() {
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setTransactions([])
    setIsProfileOpen(false)
  }

  async function createTransaction(event) {
    event.preventDefault()
    setMessage('')

    const repeatCount = form.recurrence === 'monthly' ? Number(form.repeat_months) : 1
    const recurrenceGroupId = crypto.randomUUID()

    const rows = Array.from({ length: repeatCount }).map((_, index) => ({
      description: form.description,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      person: form.person,
      due_date: addMonths(form.due_date, index),
      status: form.status,
      recurrence: form.recurrence,
      recurrence_group_id: form.recurrence === 'monthly' ? recurrenceGroupId : null,
      user_id: session.user.id
    }))

    const { error } = await supabase.from('transactions').insert(rows)

    if (error) {
      setMessage(error.message)
      return
    }

    setForm(initialForm)
    setIsModalOpen(false)
    fetchTransactions()
  }

  async function updateTransactionStatus(id, nextStatus) {
    const { error } = await supabase
      .from('transactions')
      .update({ status: nextStatus })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setSelectedTransaction(null)
    fetchTransactions()
  }

  const monthTransactions = useMemo(() => {
    return transactions.filter(item => item.due_date?.startsWith(monthFilter))
  }, [transactions, monthFilter])

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') return monthTransactions
    return monthTransactions.filter(item => item.status === statusFilter)
  }, [monthTransactions, statusFilter])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, item) => {
      const key = item.due_date
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {})
  }, [filteredTransactions])

  const summary = useMemo(() => {
    const income = monthTransactions
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const expenses = monthTransactions
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const paidExpenses = monthTransactions
      .filter(item => item.type === 'expense' && item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const pendingExpenses = monthTransactions
      .filter(item => item.type === 'expense' && item.status === 'pending')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const pendingIncome = monthTransactions
      .filter(item => item.type === 'income' && item.status === 'pending')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    return {
      income,
      expenses,
      paidExpenses,
      pendingExpenses,
      pendingIncome,
      accountBalance: income - paidExpenses,
      expectedBalance: income + pendingIncome - paidExpenses - pendingExpenses
    }
  }, [monthTransactions])

  const expectedBalanceText =
    summary.expectedBalance < 0
      ? `-${formatMoney(Math.abs(summary.expectedBalance))}`
      : formatMoney(summary.expectedBalance)

  const expectedBalanceClass =
    summary.expectedBalance < 0 ? 'forecast-negative' : 'forecast-positive'

  if (loading) {
    return <main className="app-mobile loading-screen">Carregando...</main>
  }

  if (!session) {
    return (
      <main className="auth-screen dark-bg">
        <section className="auth-card">
          <h1>FINANÇAS</h1>
          <p>Organize as contas da casa.</p>

          <input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />

          <button onClick={signIn}>Entrar</button>
          <button className="ghost-button" onClick={signUp}>Criar conta</button>

          {message && <p className="message">{message}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="app-mobile dark-bg">
      {view === 'home' && (
        <section className="page home-page">
          <header className="home-header">
            <h1>FINANÇAS</h1>
            <p>Seja bem-vindo</p>
          </header>

          <section className="balance-card">
            <MonthSelector value={monthFilter} onChange={setMonthFilter} />

            <span className="soft-label">Saldo em conta:</span>
            <strong className="main-balance">{formatMoney(summary.accountBalance)}</strong>

            <div className="money-pills">
              <div>
                <span>Receitas</span>
                <strong className="pill green-pill">{formatMoney(summary.income)}</strong>
              </div>
              <div>
                <span>Despesas</span>
                <strong className="pill red-pill">{formatMoney(summary.expenses)}</strong>
              </div>
            </div>
          </section>

          <InfoCard label="A receber:" value={formatMoney(summary.pendingIncome)} />
          <InfoCard label="A pagar:" value={formatMoney(summary.pendingExpenses)} />
        </section>
      )}

      {view === 'transactions' && (
        <section className="page transactions-page">
          <h2>Transações</h2>

          <section className="transactions-panel">
            <div className="filters-row">
              <MonthSelector value={monthFilter} onChange={setMonthFilter} compact />

              <select className="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos</option>
              </select>
            </div>

            <div className="transactions-list">
              {filteredTransactions.length === 0 && <p className="empty-state">Nenhuma transação nesse mês.</p>}

              {Object.entries(groupedTransactions).map(([date, items]) => (
                <div className="date-group" key={date}>
                  <h3>{getDayLabel(date)}</h3>

                  <div className="date-items">
                    {items.map(item => {
                      const state = getTransactionState(item)

                      return (
                        <article
                          className={`transaction-item ${state.className}`}
                          key={item.id}
                          onClick={() => setSelectedTransaction(item)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setSelectedTransaction(item)
                            }
                          }}
                          tabIndex={0}
                          role="button"
                        >
                          <div className="transaction-info">
                            <strong>{item.description}</strong>
                            <span>{getInstallmentsLabel(item)}</span>
                          </div>

                          <div className="transaction-value">
                            <strong>{formatMoney(item.amount)}</strong>
                            <span>{state.label}</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <footer className="forecast-box">
              <span>SALDO PREVISTO</span>
              <strong className={expectedBalanceClass}>{expectedBalanceText}</strong>
            </footer>
          </section>
        </section>
      )}

      <BottomNav
        activeView={view}
        setView={setView}
        openAdd={() => setIsModalOpen(true)}
        openProfile={() => setIsProfileOpen(true)}
        signOut={signOut}
      />

      {isModalOpen && (
        <TransactionModal
          form={form}
          setForm={setForm}
          onSubmit={createTransaction}
          onClose={() => setIsModalOpen(false)}
          message={message}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          email={session.user.email}
          onClose={() => setIsProfileOpen(false)}
          signOut={signOut}
        />
      )}

      {selectedTransaction && (
        <TransactionStatusModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdateStatus={updateTransactionStatus}
        />
      )}
    </main>
  )
}

function MonthSelector({ value, onChange, compact = false }) {
  return (
    <label className={`month-selector ${compact ? 'compact' : ''}`}>
      <span>{getMonthLabel(value)}</span>
      <input type="month" value={value} onChange={e => onChange(e.target.value)} />
      <ChevronDown className="chevron" size={22} strokeWidth={2.4} />
    </label>
  )
}

function InfoCard({ label, value }) {
  return (
    <article className="info-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function BottomNav({ activeView, setView, openAdd, openProfile, signOut }) {
  return (
    <nav className="bottom-nav">
      <button className={activeView === 'home' ? 'active' : ''} onClick={() => setView('home')} aria-label="Resumo">
        <BarChart3 size={28} strokeWidth={2.8} />
      </button>

      <button className={activeView === 'transactions' ? 'active' : ''} onClick={() => setView('transactions')} aria-label="Transações">
        <ReceiptText size={28} strokeWidth={2.8} />
      </button>

      <button className="add-button" onClick={openAdd} aria-label="Adicionar lançamento">
        <Plus size={44} strokeWidth={3.2} />
      </button>

      <button onClick={openProfile} aria-label="Perfil">
        <UserCircle size={29} strokeWidth={2.8} />
      </button>

      <button onClick={signOut} aria-label="Sair">
        <LogOut size={29} strokeWidth={2.8} />
      </button>
    </nav>
  )
}

function TransactionModal({ form, setForm, onSubmit, onClose, message }) {
  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={onSubmit}>
        <div className="modal-header">
          <h2>Novo lançamento</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        <input placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        <input placeholder="Valor" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />

        <div className="two-columns">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>

          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="pending">Pendente</option>
            <option value="paid">Pago/recebido</option>
          </select>
        </div>

        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option>Moradia</option>
          <option>Mercado</option>
          <option>Transporte</option>
          <option>Internet/Telefone</option>
          <option>Energia/Água</option>
          <option>Cartão</option>
          <option>Lazer</option>
          <option>Saúde</option>
          <option>Salário</option>
          <option>Outros</option>
        </select>

        <div className="two-columns">
          <select value={form.person} onChange={e => setForm({ ...form, person: e.target.value })}>
            <option>Eu</option>
            <option>Esposa</option>
            <option>Casal</option>
          </select>

          <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
        </div>

        <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
          <option value="none">Não repetir</option>
          <option value="monthly">Repetir mensalmente</option>
        </select>

        {form.recurrence === 'monthly' && (
          <select value={form.repeat_months} onChange={e => setForm({ ...form, repeat_months: e.target.value })}>
            <option value="3">3 meses</option>
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
          </select>
        )}

        <button className="submit-button" type="submit">Adicionar</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  )
}

function ProfileModal({ email, onClose, signOut }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card profile-card">
        <div className="modal-header">
          <h2>Perfil</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        <p className="profile-label">Logado como</p>
        <strong className="profile-email">{email}</strong>

        <button className="submit-button" onClick={signOut}>Sair da conta</button>
      </section>
    </div>
  )
}

function TransactionStatusModal({ transaction, onClose, onUpdateStatus }) {
  const isIncome = transaction.type === 'income'
  const currentState = getTransactionState(transaction)

  return (
    <div className="modal-backdrop">
      <section className="modal-card status-card">
        <div className="modal-header">
          <h2>Status</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        <div className="status-summary">
          <strong>{transaction.description}</strong>
          <span>{formatMoney(transaction.amount)}</span>
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
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)