import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  Bell,
  Eye,
  EyeOff,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  ArrowUpDown,
  Filter,
  CheckCircle2
} from 'lucide-react'
import { today, currentMonth, addDays, addWeeks, addMonths, getDayLabel } from './utils/date'
import { formatMoney } from './utils/formatters'
import { CHART_COLORS } from './constants/categories'
import { MonthSelector } from './components/MonthSelector'
import { BottomNav } from './components/BottomNav'
import { CircularProgress } from './components/CircularProgress'
import { ExpenseChartCard } from './components/ExpenseChartCard'
import { TransactionItem } from './components/TransactionItem'
import { TransactionModal } from './components/modals/TransactionModal'
import { ProfileModal } from './components/modals/ProfileModal'
import { TransactionStatusModal } from './components/modals/TransactionStatusModal'
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal'
import { NotificationsModal } from './components/modals/NotificationsModal'
import { ForgotPasswordModal } from './components/modals/ForgotPasswordModal'
import './style.css'

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

function InfoCard({ label, value }) {
  return (
    <article className="info-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

  // Modo Privacidade
  const [isPrivate, setIsPrivate] = useState(() => {
    return localStorage.getItem('financas_privacy_mode') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('financas_privacy_mode', String(isPrivate))
  }, [isPrivate])

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('')
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(initialForm)
  const [monthFilter, setMonthFilter] = useState(currentMonth)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Modais e navegação
  const [message, setMessage] = useState('')
  const [view, setView] = useState('home')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installMessage, setInstallMessage] = useState('')
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hasShownAlertPopup, setHasShownAlertPopup] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
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
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('due_date', { ascending: false })

      if (error) {
        setMessage(error.message)
        return
      }

      setTransactions(data || [])
    } catch (err) {
      console.error('Erro ao buscar transações:', err)
      setMessage(
        err.message === 'Failed to fetch'
          ? 'Erro de conexão com o Supabase. Verifique a URL e a Anon Key no .env.'
          : err.message || 'Erro ao carregar dados.'
      )
    }
  }

  async function signIn() {
    setMessage('')
    if (!email || !password) {
      setMessage('Preencha o e-mail e a senha.')
      return
    }
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } catch (err) {
      setMessage(
        err.message === 'Failed to fetch'
          ? 'Erro de conexão com o Supabase. Verifique se o projeto está ativo.'
          : err.message
      )
    }
    setAuthLoading(false)
  }

  async function signUp() {
    setMessage('')
    if (!email || !password) {
      setMessage('Preencha o e-mail e a senha.')
      return
    }
    if (password.length < 6) {
      setMessage('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else if (data.session) {
        setMessage('Conta criada e autenticada com sucesso!')
      } else {
        setMessage('Conta criada! Verifique sua caixa de entrada para confirmar o e-mail.')
      }
    } catch (err) {
      setMessage(
        err.message === 'Failed to fetch'
          ? 'Erro de conexão com o Supabase. Verifique se o projeto está ativo.'
          : err.message
      )
    }
    setAuthLoading(false)
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
      setInstallMessage('No Android, use o menu do navegador e escolha “Instalar app”. No iPhone, toque em Compartilhar > Adicionar à Tela de Início.')
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

  function openCreateModal(type = 'expense') {
    setForm({ ...initialForm, type })
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

    try {
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
      let repeatCount = isInstallment
        ? Number(form.installment_total)
        : form.recurrence === 'none'
          ? 1
          : Number(form.repeat_count)

      if (form.recurrence !== 'none' && (!repeatCount || repeatCount < 1)) {
        repeatCount = 12
      }

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
          recurrence: (isInstallment || form.recurrence === 'weekly') ? 'none' : form.recurrence,
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
    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err)
      setMessage(err.message || 'Erro ao salvar transação.')
    }
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

  function deleteTransaction(transaction) {
    setDeleteConfirm(transaction)
  }

  async function deleteOnlyThis(transaction) {
    setDeleteConfirm(null)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setSelectedTransaction(null)
    fetchTransactions()
  }

  async function deleteThisAndFollowing(transaction) {
    setDeleteConfirm(null)

    if (transaction.recurrence_group_id) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('recurrence_group_id', transaction.recurrence_group_id)
        .gte('due_date', transaction.due_date)

      if (error) {
        setMessage(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)

      if (error) {
        setMessage(error.message)
        return
      }
    }

    setSelectedTransaction(null)
    fetchTransactions()
  }

  async function deleteAllTransactions() {
    const confirm = window.confirm('Tem certeza que deseja apagar TODOS os seus lançamentos? Esta ação não pode ser desfeita.')
    if (!confirm) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', session.user.id)

    if (error) {
      setMessage(error.message)
      return
    }

    fetchTransactions()
    setIsProfileOpen(false)
    alert('Todos os dados foram apagados com sucesso.')
  }

  const monthTransactions = useMemo(() => {
    return transactions.filter(item => item.due_date?.startsWith(monthFilter))
  }, [transactions, monthFilter])

  const filteredTransactions = useMemo(() => {
    let result = monthTransactions
      .filter(item => statusFilter === 'all' || item.status === statusFilter)
      .filter(item => typeFilter === 'all' || item.type === typeFilter)
      .filter(item => item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Ordenação personalizada
    result = [...result].sort((a, b) => {
      if (sortBy === 'date_desc') return b.due_date.localeCompare(a.due_date)
      if (sortBy === 'date_asc') return a.due_date.localeCompare(b.due_date)
      if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount)
      if (sortBy === 'description_asc') return a.description.localeCompare(b.description)
      return 0
    })

    return result
  }, [monthTransactions, statusFilter, typeFilter, searchQuery, sortBy])

  const exportToCSV = () => {
    const header = ['ID,Data,Descricao,Valor,Tipo,Categoria,Status\n']
    const rows = transactions.map(t =>
      `${t.id},${t.due_date},"${t.description}",${t.amount},${t.type},${t.category},${t.status}`
    )
    const csvContent = "data:text/csv;charset=utf-8," + header.concat(rows).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `financas_${monthFilter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const expensesByCategory = useMemo(() => {
    const expenses = monthTransactions.filter(t => t.type === 'expense')
    const groups = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {})
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [monthTransactions])

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

    const totalIncome = receivedIncome + pendingIncome
    const committedPercentage = totalIncome > 0 ? Math.round((allExpenses / totalIncome) * 100) : 0

    return {
      receivedIncome,
      allExpenses,
      paidExpenses,
      pendingExpenses,
      pendingIncome,
      totalIncome,
      committedPercentage,
      accountBalance: receivedIncome - paidExpenses,
      expectedBalance: receivedIncome + pendingIncome - paidExpenses - pendingExpenses
    }
  }, [monthTransactions])

  const expectedBalanceText = formatMoney(summary.expectedBalance, isPrivate)

  if (loading) {
    return <main className="app-mobile loading-screen">Carregando Finanças...</main>
  }

  if (!session) {
    return (
      <main className="auth-screen dark-bg">
        <section className="auth-card">
          <img src="/logo.png" alt="FINANCE" className="auth-logo" />
          <p>Organize suas finanças de forma simples e visual.</p>

          <div className="auth-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', width: '100%' }}>
            <button
              type="button"
              className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setMessage(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'login' ? 'var(--primary-color, #17b5a2)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setMessage(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'register' ? 'var(--primary-color, #17b5a2)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Criar Conta
            </button>
          </div>

          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <div className="password-input-wrapper">
            <input
              placeholder={authMode === 'login' ? "Senha" : "Senha (mínimo 6 caracteres)"}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Mostrar senha"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {authMode === 'login' && (
            <div style={{ width: '100%', textAlign: 'right', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}

          {authMode === 'login' ? (
            <button onClick={signIn} disabled={authLoading} className="submit-button" style={{ marginTop: '14px' }}>
              {authLoading ? 'Entrando...' : 'Entrar'}
            </button>
          ) : (
            <button onClick={signUp} disabled={authLoading} className="submit-button" style={{ marginTop: '14px' }}>
              {authLoading ? 'Cadastrando...' : 'Criar Conta'}
            </button>
          )}

          {message && (
            <p
              className="message"
              style={{
                marginTop: '12px',
                fontSize: '0.88rem',
                color: message.includes('sucesso') || message.includes('criada') ? '#10b981' : '#f87171'
              }}
            >
              {message}
            </p>
          )}
        </section>

        {isForgotPasswordOpen && (
          <ForgotPasswordModal
            onClose={() => setIsForgotPasswordOpen(false)}
            initialEmail={email}
          />
        )}
      </main>
    )
  }

  return (
    <main className="app-mobile dark-bg">
      {view === 'home' && (
        <section className="page home-page">
          <header className="home-header">
            <div className="home-header-text">
              <img src="/logo.png" alt="FINANCE" className="header-logo" />
              <p>Seja bem-vindo</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Botão de Modo Privacidade no Topo */}
              <button
                className="notification-btn privacy-toggle-btn"
                onClick={() => setIsPrivate(prev => !prev)}
                title={isPrivate ? 'Mostrar valores' : 'Ocultar valores'}
                aria-label="Alternar privacidade de valores"
              >
                {isPrivate ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>

              <button
                className="notification-btn"
                onClick={() => setIsNotificationsOpen(true)}
                title="Notificações e Vencimentos"
                aria-label="Notificações"
              >
                <Bell size={22} />
                {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
              </button>
            </div>
          </header>

          {alerts.length > 0 && (
            <div className="urgent-alert-banner" onClick={() => setIsNotificationsOpen(true)}>
              <div className="urgent-alert-left">
                <div className="urgent-icon-wrapper">
                  <Bell size={18} />
                </div>
                <div className="urgent-alert-text">
                  <strong>{alerts.length} conta{alerts.length > 1 ? 's' : ''} para atenção</strong>
                  <span>Vencendo hoje ou atrasada</span>
                </div>
              </div>
              <span className="urgent-action-tag">Resolver</span>
            </div>
          )}

          <section className="balance-card modern-balance-card">
            <div className="balance-top-row">
              <div className="wallet-badge">
                <Wallet size={15} />
                <span>SALDO EM CONTA</span>
              </div>
              <MonthSelector value={monthFilter} onChange={setMonthFilter} compact />
            </div>

            <div className="balance-hero">
              <strong className="main-balance hero-balance">
                {formatMoney(summary.accountBalance, isPrivate)}
              </strong>
            </div>

            <div className="balance-metrics-stack">
              <div className="metric-row-full income-row">
                <div className="metric-info-group">
                  <div className="tile-icon-wrapper income-badge">
                    <ArrowUpRight size={18} />
                  </div>
                  <span className="metric-label">RECEBIDAS</span>
                </div>
                <strong className="metric-value income-value">
                  {formatMoney(summary.receivedIncome, isPrivate)}
                </strong>
              </div>

              <div className="metric-row-full expense-row">
                <div className="metric-info-group">
                  <div className="tile-icon-wrapper expense-badge">
                    <ArrowDownRight size={18} />
                  </div>
                  <span className="metric-label">DESPESAS</span>
                </div>
                <strong className="metric-value expense-value">
                  {formatMoney(summary.allExpenses, isPrivate)}
                </strong>
              </div>

              <div className="metric-row-full forecast-row">
                <div className="metric-info-group">
                  <div className="tile-icon-wrapper forecast-badge">
                    <TrendingUp size={18} />
                  </div>
                  <span className="metric-label">SALDO PREVISTO</span>
                </div>
                <strong className={`metric-value ${summary.expectedBalance < 0 ? 'expense-value' : 'income-value'}`}>
                  {expectedBalanceText}
                </strong>
              </div>
            </div>
          </section>

          <CircularProgress
            percentage={summary.committedPercentage}
            spent={formatMoney(summary.allExpenses, isPrivate)}
            total={formatMoney(summary.totalIncome, isPrivate)}
            expectedProfit={expectedBalanceText}
            expectedProfitRaw={summary.expectedBalance}
            isPrivate={isPrivate}
          />

          <ExpenseChartCard
            expensesByCategory={expensesByCategory}
            CHART_COLORS={CHART_COLORS}
            isPrivate={isPrivate}
          />

          <InfoCard label="A receber:" value={formatMoney(summary.pendingIncome, isPrivate)} />
          <InfoCard label="A pagar:" value={formatMoney(summary.pendingExpenses, isPrivate)} />
        </section>
      )}

      {view === 'transactions' && (
        <section className="page transactions-page">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Transações</h2>
            <button
              className="notification-btn privacy-toggle-btn"
              onClick={() => setIsPrivate(prev => !prev)}
              title={isPrivate ? 'Mostrar valores' : 'Ocultar valores'}
              aria-label="Alternar privacidade de valores"
            >
              {isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <section className="transactions-panel">
            <div className="search-row">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  placeholder="Buscar lançamentos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

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

            {/* Linha de Ordenação */}
            <div className="sort-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ArrowUpDown size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Ordenar:</span>
              <select
                className="status-filter sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="date_desc">Data (Mais recentes)</option>
                <option value="date_asc">Data (Mais antigas)</option>
                <option value="amount_desc">Maior valor</option>
                <option value="amount_asc">Menor valor</option>
                <option value="description_asc">Nome (A - Z)</option>
              </select>
            </div>

            <div className="forecast-row">
              <div className="forecast-card-clean">
                <span className="forecast-label-simple">Lucro Previsto</span>
                <strong className={`forecast-value-simple ${summary.expectedBalance < 0 ? 'negative' : 'positive'}`}>
                  {expectedBalanceText}
                </strong>
              </div>
            </div>

            <div className="transactions-list">
              {filteredTransactions.length === 0 ? (
                <div className="empty-state-card" style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: 'var(--glass-bg)',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <CheckCircle2 size={38} style={{ color: 'var(--primary-color)', margin: '0 auto 10px', opacity: 0.8 }} />
                  <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '1rem', marginBottom: '4px' }}>
                    Nenhum lançamento encontrado
                  </strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    {searchQuery ? 'Tente buscar com outro termo ou limpe o filtro.' : 'Clique no botão "+" abaixo para adicionar seu primeiro lançamento.'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedTransactions).map(([date, items]) => (
                  <div className="date-group" key={date}>
                    <h3>{getDayLabel(date)}</h3>
                    <div className="date-items">
                      {items.map(item => (
                        <TransactionItem
                          key={item.id}
                          item={item}
                          onClick={() => setSelectedTransaction(item)}
                          onToggleStatus={updateTransactionStatus}
                          isPrivate={isPrivate}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
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
          deleteAllTransactions={deleteAllTransactions}
          exportToCSV={exportToCSV}
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
        />
      )}

      {selectedTransaction && (
        <TransactionStatusModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdateStatus={updateTransactionStatus}
          onEdit={openEditModal}
          onDelete={deleteTransaction}
          isPrivate={isPrivate}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          transaction={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onDeleteOnly={deleteOnlyThis}
          onDeleteFollowing={deleteThisAndFollowing}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          alerts={alerts}
          onClose={() => setIsNotificationsOpen(false)}
          onOpenTransaction={openEditModal}
          isPrivate={isPrivate}
        />
      )}
    </main>
  )
}
