import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  Bell,
  Eye,
  EyeOff,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ArrowUpDown,
  CheckCircle2,
  MoreHorizontal
} from 'lucide-react'
import { today, currentMonth, addDays, addWeeks, addMonths, getDayLabel, getGreeting } from './utils/date'
import { formatMoney, roundMoney } from './utils/formatters'
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
  installment_total: '1',
  installment_mode: 'installment'
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
    setMessage('')
    setForm({
      ...initialForm,
      type,
      category: type === 'income' ? 'Salário' : 'Moradia'
    })
    setIsModalOpen(true)
  }

  function openEditModal(transaction) {
    setMessage('')
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
      installment_total: String(transaction.installment_total || 1),
      installment_mode: 'installment'
    })
    setIsModalOpen(true)
  }

  async function saveTransaction(event) {
    event.preventDefault()
    setMessage('')

    const numericAmount = roundMoney(form.amount)
    if (numericAmount <= 0) {
      setMessage('Informe um valor maior que zero.')
      return
    }

    try {
      if (form.id) {
        const { error } = await supabase
          .from('transactions')
          .update({
            description: form.description.trim(),
            amount: numericAmount,
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

      const isInstallment = form.recurrence === 'none' && Number(form.installment_total) > 1
      let repeatCount = isInstallment
        ? Number(form.installment_total)
        : form.recurrence === 'none'
          ? 1
          : Number(form.repeat_count)

      if (form.recurrence !== 'none' && (!repeatCount || repeatCount < 1)) {
        repeatCount = 12
      }

      const recurrenceGroupId = repeatCount > 1 ? crypto.randomUUID() : null

      // Cálculo preciso do valor de cada parcela caso o usuário escolha dividir o valor total
      const shouldDivideTotal = isInstallment && form.installment_mode === 'total'
      const baseInstallmentAmount = shouldDivideTotal
        ? Math.floor((numericAmount / repeatCount) * 100) / 100
        : numericAmount
      const remainderCents = shouldDivideTotal
        ? roundMoney(numericAmount - baseInstallmentAmount * repeatCount)
        : 0

      const rows = Array.from({ length: repeatCount }).map((_, index) => {
        let dueDate = form.due_date

        if (isInstallment || form.recurrence === 'monthly') {
          dueDate = addMonths(form.due_date, index)
        } else if (form.recurrence === 'weekly') {
          dueDate = addWeeks(form.due_date, index)
        }

        const rowAmount = index === 0
          ? roundMoney(baseInstallmentAmount + remainderCents)
          : roundMoney(baseInstallmentAmount)

        // Apenas a primeira ocorrência (ou vencimentos até hoje) herda o status 'paid';
        // parcelas/meses futuros começam como 'pending' para não distorcer os saldos futuros.
        const rowStatus = index === 0 ? form.status : 'pending'

        return {
          description: form.description.trim(),
          amount: rowAmount,
          type: form.type,
          category: form.category,
          person: 'Casal',
          due_date: dueDate,
          status: rowStatus,
          recurrence: isInstallment ? 'none' : form.recurrence,
          recurrence_group_id: recurrenceGroupId,
          installment_current: isInstallment ? index + 1 : 1,
          installment_total: isInstallment ? repeatCount : 1,
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

  const filteredSummary = useMemo(() => {
    const income = roundMoney(
      filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
    )
    const expense = roundMoney(
      filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
    )
    const net = roundMoney(income - expense)
    const isFiltering = statusFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim() !== ''
    return { income, expense, net, isFiltering }
  }, [filteredTransactions, statusFilter, typeFilter, searchQuery])

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
      acc[t.category] = roundMoney((acc[t.category] || 0) + Number(t.amount))
      return acc
    }, {})
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthTransactions])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, item) => {
      const key = item.due_date
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {})
  }, [filteredTransactions])

  const recentMonthTransactions = useMemo(() => {
    return [...monthTransactions]
      .sort((a, b) => b.due_date.localeCompare(a.due_date))
      .slice(0, 5)
  }, [monthTransactions])

  const summary = useMemo(() => {
    const receivedIncome = roundMoney(
      monthTransactions
        .filter(item => item.type === 'income' && item.status === 'paid')
        .reduce((sum, item) => sum + Number(item.amount), 0)
    )

    const pendingIncome = roundMoney(
      monthTransactions
        .filter(item => item.type === 'income' && item.status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount), 0)
    )

    const paidExpenses = roundMoney(
      monthTransactions
        .filter(item => item.type === 'expense' && item.status === 'paid')
        .reduce((sum, item) => sum + Number(item.amount), 0)
    )

    const pendingExpenses = roundMoney(
      monthTransactions
        .filter(item => item.type === 'expense' && item.status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount), 0)
    )

    const totalIncome = roundMoney(receivedIncome + pendingIncome)
    const allExpenses = roundMoney(paidExpenses + pendingExpenses)
    const accountBalance = roundMoney(receivedIncome - paidExpenses)
    const expectedBalance = roundMoney(totalIncome - allExpenses)

    const committedPercentage = totalIncome > 0
      ? Math.round((allExpenses / totalIncome) * 100)
      : (allExpenses > 0 ? 100 : 0)

    return {
      receivedIncome,
      pendingIncome,
      totalIncome,
      paidExpenses,
      pendingExpenses,
      allExpenses,
      committedPercentage,
      accountBalance,
      expectedBalance
    }
  }, [monthTransactions])

  const expectedBalanceText = formatMoney(summary.expectedBalance, isPrivate)
  const userName = useMemo(() => {
    if (!session?.user?.email) return 'Minha Conta'
    const raw = session.user.email.split('@')[0].replace(/[._-]+/g, ' ')
    return raw.replace(/\b\w/g, l => l.toUpperCase())
  }, [session])

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
                borderRadius: '12px',
                border: 'none',
                background: authMode === 'login' ? 'var(--primary-color, #10b981)' : 'rgba(255, 255, 255, 0.05)',
                color: authMode === 'login' ? '#042f2e' : '#fff',
                fontWeight: '700',
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
                borderRadius: '12px',
                border: 'none',
                background: authMode === 'register' ? 'var(--primary-color, #10b981)' : 'rgba(255, 255, 255, 0.05)',
                color: authMode === 'register' ? '#042f2e' : '#fff',
                fontWeight: '700',
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
            <button onClick={signIn} disabled={authLoading} className="ref-white-submit-btn" style={{ marginTop: '14px' }}>
              {authLoading ? 'Entrando...' : 'Entrar'}
            </button>
          ) : (
            <button onClick={signUp} disabled={authLoading} className="ref-white-submit-btn" style={{ marginTop: '14px' }}>
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
          {/* HERO CARD VERDE (Inspirado na Referência) */}
          <section className="ref-hero-wallet-card">
            <header className="ref-hero-topbar">
              <div className="ref-user-greeting" onClick={() => setIsProfileOpen(true)} role="button" tabIndex={0}>
                <div className="ref-avatar-wrapper">
                  <img src="/logo.png" alt="FINANCE" className="ref-avatar-img" />
                </div>
                <div className="ref-greeting-text">
                  <span>{getGreeting()}</span>
                  <strong>{userName}</strong>
                </div>
              </div>

              <div className="ref-hero-top-actions">
                <MonthSelector value={monthFilter} onChange={setMonthFilter} compact />

                <button
                  type="button"
                  className="ref-circle-glass-btn"
                  onClick={() => setIsNotificationsOpen(true)}
                  title="Notificações e Vencimentos"
                  aria-label="Notificações"
                >
                  <Bell size={18} strokeWidth={2.2} />
                  {alerts.length > 0 && <span className="ref-notif-dot">{alerts.length}</span>}
                </button>
              </div>
            </header>

            <div className="ref-wallet-balance-block">
              <span className="ref-balance-caption">Saldo em Conta (Realizado)</span>
              <div className="ref-balance-value-row">
                <strong className="ref-hero-balance-number">
                  {formatMoney(summary.accountBalance, isPrivate)}
                </strong>
                <button
                  type="button"
                  className="ref-inline-eye-btn"
                  onClick={() => setIsPrivate(prev => !prev)}
                  title={isPrivate ? 'Mostrar valores' : 'Ocultar valores'}
                  aria-label="Alternar privacidade de valores"
                >
                  {isPrivate ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
                </button>
              </div>
              <div className="ref-balance-sub-pill">
                <TrendingUp size={13} strokeWidth={2.2} />
                <span>Saldo previsto no mês: <strong>{expectedBalanceText}</strong></span>
              </div>
            </div>

            {/* 4 Botões Translúcidos de Ação Rápida dentro do Hero Card */}
            <div className="ref-hero-actions-grid">
              <button
                type="button"
                className="ref-hero-action-tile"
                onClick={() => openCreateModal('expense')}
              >
                <span className="ref-action-icon-circle">
                  <ArrowUpRight size={18} strokeWidth={2.3} />
                </span>
                <span>Despesa</span>
              </button>

              <button
                type="button"
                className="ref-hero-action-tile"
                onClick={() => openCreateModal('income')}
              >
                <span className="ref-action-icon-circle">
                  <ArrowDownLeft size={18} strokeWidth={2.3} />
                </span>
                <span>Receita</span>
              </button>

              <button
                type="button"
                className="ref-hero-action-tile"
                onClick={() => setView('transactions')}
              >
                <span className="ref-action-icon-circle">
                  <ArrowUpDown size={17} strokeWidth={2.3} />
                </span>
                <span>Extrato</span>
              </button>

              <button
                type="button"
                className="ref-hero-action-tile"
                onClick={() => setIsProfileOpen(true)}
              >
                <span className="ref-action-icon-circle">
                  <MoreHorizontal size={18} strokeWidth={2.3} />
                </span>
                <span>Mais</span>
              </button>
            </div>
          </section>

          {alerts.length > 0 && (
            <div className="urgent-alert-banner" onClick={() => setIsNotificationsOpen(true)}>
              <div className="urgent-alert-left">
                <div className="urgent-icon-wrapper">
                  <Bell size={18} />
                </div>
                <div className="urgent-alert-text">
                  <strong>{alerts.length} conta{alerts.length > 1 ? 's' : ''} para atenção</strong>
                  <span>Vencendo hoje, amanhã ou em atraso</span>
                </div>
              </div>
              <span className="urgent-action-tag">Resolver</span>
            </div>
          )}

          {/* CARD RESUMO DO MÊS (Contas 100% Consistentes: Realizado + Pendente = Total) */}
          <section className="ref-summary-banner-card">
            <div className="ref-summary-header">
              <div>
                <span className="ref-summary-kicker">Balanço Mensal</span>
                <h3>Resumo de Contas</h3>
              </div>
              <span className={`ref-net-pill ${summary.expectedBalance < 0 ? 'is-neg' : 'is-pos'}`}>
                Previsto: {expectedBalanceText}
              </span>
            </div>

            <div className="ref-summary-columns">
              <div className="ref-summary-box income-box">
                <div className="ref-summary-box-top">
                  <span className="ref-dot income-dot" />
                  <span className="ref-box-title">Receitas</span>
                </div>
                <strong className="ref-box-main income-text">
                  {formatMoney(summary.totalIncome, isPrivate)}
                </strong>
                <div className="ref-box-breakdown">
                  <span>Recebido: <b>{formatMoney(summary.receivedIncome, isPrivate)}</b></span>
                  <span>A receber: <b>{formatMoney(summary.pendingIncome, isPrivate)}</b></span>
                </div>
              </div>

              <div className="ref-summary-box expense-box">
                <div className="ref-summary-box-top">
                  <span className="ref-dot expense-dot" />
                  <span className="ref-box-title">Despesas</span>
                </div>
                <strong className="ref-box-main expense-text">
                  {formatMoney(summary.allExpenses, isPrivate)}
                </strong>
                <div className="ref-box-breakdown">
                  <span>Pago: <b>{formatMoney(summary.paidExpenses, isPrivate)}</b></span>
                  <span>A pagar: <b>{formatMoney(summary.pendingExpenses, isPrivate)}</b></span>
                </div>
              </div>
            </div>
          </section>

          {/* LISTA DE TRANSAÇÕES RECENTES NA HOME (Estilo "Transactions / View all" da referência) */}
          <section className="ref-home-tx-section">
            <div className="ref-section-title-row">
              <h3>Transações</h3>
              <button
                type="button"
                className="ref-view-all-btn"
                onClick={() => setView('transactions')}
              >
                Ver tudo
              </button>
            </div>

            {recentMonthTransactions.length === 0 ? (
              <div className="ref-empty-inline">
                <p>Nenhum lançamento neste mês.</p>
                <button
                  type="button"
                  className="ref-pill-cta"
                  onClick={() => openCreateModal('expense')}
                >
                  + Adicionar lançamento
                </button>
              </div>
            ) : (
              <div className="ref-tx-feed">
                {recentMonthTransactions.map(item => (
                  <TransactionItem
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedTransaction(item)}
                    onToggleStatus={updateTransactionStatus}
                    isPrivate={isPrivate}
                    showDate
                  />
                ))}
              </div>
            )}
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
        </section>
      )}

      {view === 'transactions' && (
        <section className="page transactions-page">
          <div className="ref-tx-page-header">
            <h2>Extrato de Transações</h2>
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
            <div className="sort-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
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

            {/* Resumo Dinâmico: mostra o Saldo Previsto do mês e, quando filtrado, o total exato do filtro */}
            <div className="forecast-row">
              <div className="forecast-card-clean">
                <div>
                  <span className="forecast-label-simple">
                    {filteredSummary.isFiltering ? 'Resultado do Filtro' : 'Saldo Previsto do Mês'}
                  </span>
                  {filteredSummary.isFiltering && (
                    <small style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? 's' : ''}
                    </small>
                  )}
                </div>
                <strong
                  className={`forecast-value-simple ${
                    (filteredSummary.isFiltering ? filteredSummary.net : summary.expectedBalance) < 0
                      ? 'negative'
                      : 'positive'
                  }`}
                >
                  {formatMoney(
                    filteredSummary.isFiltering
                      ? (typeFilter === 'expense' ? filteredSummary.expense : typeFilter === 'income' ? filteredSummary.income : filteredSummary.net)
                      : summary.expectedBalance,
                    isPrivate
                  )}
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
                    {searchQuery ? 'Tente buscar com outro termo ou limpe o filtro.' : 'Toque no botão "+" abaixo para adicionar seu primeiro lançamento.'}
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
          currentBalance={summary.accountBalance}
          isPrivate={isPrivate}
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
