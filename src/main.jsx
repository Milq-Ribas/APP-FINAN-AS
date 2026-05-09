import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import {
  BarChart3,
  ReceiptText,
  Plus,
  UserCircle,
  LogOut,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  Download,
  Bell
} from 'lucide-react'
import './style.css'

const today = new Date().toISOString().slice(0, 10)
const currentMonth = new Date().toISOString().slice(0, 7)

const initialForm = {
  id: null,
  description: '',
  amount: '',
  type: 'expense',
  category: 'Moradia',
  due_date: today,
  status: 'pending',
  recurrence: 'none',
  repeat_count: '6',
  installment_total: '1'
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48]

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

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day + amount)
  return date.toISOString().slice(0, 10)
}

function addWeeks(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + amount * 7)
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
  if (item.installment_total && Number(item.installment_total) > 1) {
    return `${item.installment_current || 1} / ${item.installment_total} X`
  }

  if (item.recurrence === 'monthly') return 'RECORRENTE MENSAL'
  if (item.recurrence === 'weekly') return 'RECORRENTE SEMANAL'

  return item.category?.toUpperCase() || 'LANÇAMENTO'
}

function getTransactionState(item) {
  const isIncome = item.type === 'income'
  const isPaid = item.status === 'paid'
  const isOverdue = !isPaid && item.due_date < today

  if (isOverdue) return { label: 'ATRASADO', className: 'overdue' }
  if (isPaid && isIncome) return { label: 'RECEBIDO', className: 'paid income-paid' }
  if (isPaid) return { label: 'PAGO', className: 'paid expense-paid' }
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
  const [typeFilter, setTypeFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [view, setView] = useState('home')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installMessage, setInstallMessage] = useState('')
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hasShownAlertPopup, setHasShownAlertPopup] = useState(false)

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

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const alerts = useMemo(() => {
    const tomorrowStr = addDays(today, 1)
    return transactions.filter(t => 
      t.type === 'expense' && 
      t.status === 'pending' && 
      t.due_date <= tomorrowStr
    ).sort((a, b) => a.due_date.localeCompare(b.due_date))
  }, [transactions])

  useEffect(() => {
    if (alerts.length > 0 && !hasShownAlertPopup && view === 'home') {
      setIsNotificationsOpen(true)
      setHasShownAlertPopup(true)
    }
  }, [alerts, hasShownAlertPopup, view])

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

  async function installApp() {
    setInstallMessage('')

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      setInstallMessage('O app já está instalado.')
      return
    }

    if (!deferredPrompt) {
      setInstallMessage('No Android, toque no menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”. No iPhone, use Compartilhar > Adicionar à Tela de Início.')
      return
    }

    deferredPrompt.prompt()

    const result = await deferredPrompt.userChoice

    if (result.outcome === 'accepted') {
      setInstallMessage('Instalação iniciada.')
    } else {
      setInstallMessage('Instalação cancelada.')
    }

    setDeferredPrompt(null)
  }

  function openCreateModal() {
    setForm(initialForm)
    setIsModalOpen(true)
  }

  function openEditModal(transaction) {
    setSelectedTransaction(null)

    setForm({
      id: transaction.id,
      description: transaction.description || '',
      amount: String(transaction.amount || ''),
      type: transaction.type || 'expense',
      category: transaction.category || 'Moradia',
      due_date: transaction.due_date || today,
      status: transaction.status || 'pending',
      recurrence: 'none',
      repeat_count: '1',
      installment_total: String(transaction.installment_total || 1)
    })

    setIsModalOpen(true)
  }

  async function saveTransaction(event) {
    event.preventDefault()
    setMessage('')

    if (form.id) {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: form.description,
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          due_date: form.due_date,
          status: form.status,
        })
        .eq('id', form.id)

      if (error) {
        setMessage(error.message)
        return
      }

      setForm(initialForm)
      setIsModalOpen(false)
      fetchTransactions()
      return
    }

    const isInstallment = Number(form.installment_total) > 1
    const repeatCount = isInstallment
      ? Number(form.installment_total)
      : form.recurrence === 'none'
        ? 1
        : Number(form.repeat_count)

    const recurrenceGroupId = crypto.randomUUID()

    const rows = Array.from({ length: repeatCount }).map((_, index) => {
      let dueDate = form.due_date

      if (isInstallment || form.recurrence === 'monthly') {
        dueDate = addMonths(form.due_date, index)
      }

      if (!isInstallment && form.recurrence === 'weekly') {
        dueDate = addWeeks(form.due_date, index)
      }

      return {
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        person: 'Casal',
        due_date: dueDate,
        status: form.status,
        recurrence: isInstallment ? 'installment' : form.recurrence,
        recurrence_group_id: repeatCount > 1 ? recurrenceGroupId : null,
        installment_current: isInstallment ? index + 1 : 1,
        installment_total: isInstallment ? Number(form.installment_total) : 1,
        user_id: session.user.id
      }
    })

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

  async function deleteTransaction(id) {
    const confirmed = window.confirm('Deseja excluir esta transação?')
    if (!confirmed) return

    const { error } = await supabase
      .from('transactions')
      .delete()
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
    return monthTransactions
      .filter(item => statusFilter === 'all' || item.status === statusFilter)
      .filter(item => typeFilter === 'all' || item.type === typeFilter)
  }, [monthTransactions, statusFilter, typeFilter])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, item) => {
      const key = item.due_date
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {})
  }, [filteredTransactions])

  const summary = useMemo(() => {
    const receivedIncome = monthTransactions
      .filter(item => item.type === 'income' && item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const allExpenses = monthTransactions
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

    const filteredTotal = filteredTransactions.reduce((sum, item) => sum + Number(item.amount), 0)

    const totalIncome = receivedIncome + pendingIncome
    const committedPercentage = totalIncome > 0 ? Math.round((allExpenses / totalIncome) * 100) : 0

    return {
      receivedIncome,
      allExpenses,
      paidExpenses,
      pendingExpenses,
      pendingIncome,
      filteredTotal,
      totalIncome,
      committedPercentage,
      accountBalance: receivedIncome - paidExpenses,
      expectedBalance: receivedIncome + pendingIncome - paidExpenses - pendingExpenses
    }
  }, [monthTransactions, filteredTransactions])

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
            <div>
              <h1>FINANÇAS</h1>
              <p>Seja bem-vindo</p>
            </div>
            <button className="notification-btn" onClick={() => setIsNotificationsOpen(true)}>
              <Bell size={24} />
              {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
            </button>
          </header>

          <section className="balance-card">
            <MonthSelector value={monthFilter} onChange={setMonthFilter} />

            <span className="soft-label">Saldo em conta:</span>
            <strong className="main-balance">{formatMoney(summary.accountBalance)}</strong>

            <div className="money-pills">
              <div>
                <span>Recebidas</span>
                <strong className="pill green-pill">{formatMoney(summary.receivedIncome)}</strong>
              </div>
              <div>
                <span>Despesas</span>
                <strong className="pill red-pill">{formatMoney(summary.allExpenses)}</strong>
              </div>
            </div>
          </section>

          <CircularProgress 
            percentage={summary.committedPercentage} 
            spent={formatMoney(summary.allExpenses)} 
            total={formatMoney(summary.totalIncome)} 
          />

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

              <select className="status-filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">Tudo</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </div>

            <div className="filter-total">
              <span>Soma do filtro</span>
              <strong>{formatMoney(summary.filteredTotal)}</strong>
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
        openAdd={openCreateModal}
        openProfile={() => setIsProfileOpen(true)}
        signOut={signOut}
      />

      {isModalOpen && (
        <TransactionModal
          form={form}
          setForm={setForm}
          onSubmit={saveTransaction}
          onClose={() => setIsModalOpen(false)}
          message={message}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          email={session.user.email}
          onClose={() => setIsProfileOpen(false)}
          signOut={signOut}
          installApp={installApp}
          installMessage={installMessage}
        />
      )}

      {selectedTransaction && (
        <TransactionStatusModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdateStatus={updateTransactionStatus}
          onEdit={openEditModal}
          onDelete={deleteTransaction}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          alerts={alerts}
          onClose={() => setIsNotificationsOpen(false)}
          onOpenTransaction={openEditModal}
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
  const isEditing = Boolean(form.id)
  const isInstallment = Number(form.installment_total) > 1

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={onSubmit}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar lançamento' : 'Novo lançamento'}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <input placeholder="Ex: Aluguel, Salário..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        </div>

        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input placeholder="0,00" type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        </div>

        <div className="form-group">
          <label className="form-label">Tipo e status</label>
          <div className="two-columns">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="expense">💸 Despesa</option>
              <option value="income">💰 Receita</option>
            </select>

            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="pending">⏳ Pendente</option>
              <option value="paid">✅ Pago/recebido</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Categoria e vencimento</label>
          <div className="two-columns">
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

            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>

        {!isEditing && (
          <div className="form-group">
            <label className="form-label">Parcelamento</label>
            <select
              value={form.installment_total}
              onChange={e => setForm({ ...form, installment_total: e.target.value, recurrence: 'none' })}
            >
              {installmentOptions.map(option => (
                <option key={option} value={option}>
                  {option === 1 ? 'À vista (sem parcelas)' : `${option}x parcelas`}
                </option>
              ))}
            </select>

            {!isInstallment && (
              <div className="two-columns" style={{ marginTop: '12px' }}>
                <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
                  <option value="none">🔁 Não repetir</option>
                  <option value="weekly">🗓 Semanal</option>
                  <option value="monthly">📅 Mensal</option>
                </select>

                {form.recurrence !== 'none' && (
                  <select value={form.repeat_count} onChange={e => setForm({ ...form, repeat_count: e.target.value })}>
                    <option value="4">4 vezes</option>
                    <option value="6">6 vezes</option>
                    <option value="12">12 vezes</option>
                    <option value="24">24 vezes</option>
                    <option value="36">36 vezes</option>
                    <option value="48">48 vezes</option>
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        <button className="submit-button" type="submit">
          {isEditing ? 'Salvar alterações' : 'Adicionar'}
        </button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  )
}

function ProfileModal({ email, onClose, signOut, installApp, installMessage }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card profile-card">
        <div className="modal-header">
          <h2>Perfil</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        <p className="profile-label">Logado como</p>
        <strong className="profile-email">{email}</strong>

        <button className="install-button" onClick={installApp}>
          <Download size={18} />
          Instalar app
        </button>

        {installMessage && <p className="install-message">{installMessage}</p>}

        <button className="submit-button" onClick={signOut}>Sair da conta</button>
      </section>
    </div>
  )
}

function TransactionStatusModal({ transaction, onClose, onUpdateStatus, onEdit, onDelete }) {
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

        <div className="status-secondary-actions">
          <button type="button" onClick={() => onEdit(transaction)}>
            <Pencil size={17} />
            Editar
          </button>

          <button type="button" className="delete-secondary" onClick={() => onDelete(transaction.id)}>
            <Trash2 size={17} />
            Excluir
          </button>
        </div>
      </section>
    </div>
  )
}

function CircularProgress({ percentage, spent, total }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const visualPercentage = Math.min(percentage, 100)
  const offset = circumference - (visualPercentage / 100) * circumference

  let strokeColor = '#7dff86'
  if (percentage > 80) strokeColor = '#ff5c5c'
  else if (percentage > 60) strokeColor = '#ffc107'

  return (
    <article className="progress-card">
      <div className="progress-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Renda mensal comprometida</span>
        <ChevronDown size={20} className={`chevron ${isCollapsed ? 'rotate-180' : ''}`} />
      </div>

      {!isCollapsed && (
        <div className="progress-body">
          <div className="progress-container">
            <svg className="progress-svg" viewBox="0 0 110 110">
              <circle
                className="progress-bg"
                cx="55" cy="55" r={radius}
              />
              <circle
                className="progress-bar"
                cx="55" cy="55" r={radius}
                style={{
                  strokeDasharray: circumference,
                  '--offset': offset,
                  stroke: strokeColor
                }}
              />
            </svg>
            <div className="progress-text">
              <strong>{percentage}%</strong>
            </div>
          </div>
          <div className="progress-labels">
            <span>{spent} / {total}</span>
            <small>Total comprometido</small>
          </div>
        </div>
      )}
    </article>
  )
}

function NotificationsModal({ alerts, onClose, onOpenTransaction }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-header">
          <h2>Notificações</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>

        {alerts.length === 0 ? (
          <p className="empty-state">Tudo em dia! Nenhuma conta próxima do vencimento.</p>
        ) : (
          <div className="date-items">
            {alerts.map(item => {
              const isOverdue = item.due_date < today
              const isTomorrow = item.due_date === addDays(today, 1)
              const label = isOverdue ? 'Atrasado' : isTomorrow ? 'Vence amanhã' : 'Vence hoje'
              const labelClass = isOverdue ? 'overdue' : 'expense-pending'

              return (
                <article
                  className={`transaction-item ${labelClass}`}
                  key={item.id}
                  onClick={() => {
                    onOpenTransaction(item)
                    onClose()
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="transaction-info">
                    <strong>{item.description}</strong>
                    <span>{label}</span>
                  </div>
                  <div className="transaction-value">
                    <strong>{formatMoney(item.amount)}</strong>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)