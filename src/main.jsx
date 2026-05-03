import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import './style.css'

const initialForm = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Moradia',
  person: 'Eu',
  due_date: new Date().toISOString().slice(0, 10),
  status: 'pending',
  recurrence: 'none',
  repeat_months: '6'
}

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

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(initialForm)
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')

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
      .order('due_date', { ascending: true })

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
    else setMessage('Cadastro criado. Se o Supabase pedir confirmação, confira seu e-mail.')
  }

  async function signIn() {
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setTransactions([])
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
    fetchTransactions()
  }

  async function markAsPaid(id) {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'paid' })
      .eq('id', id)

    if (error) setMessage(error.message)
    fetchTransactions()
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) setMessage(error.message)
    fetchTransactions()
  }

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(item => item.due_date?.startsWith(monthFilter))
      .filter(item => statusFilter === 'all' || item.status === statusFilter)
  }, [transactions, monthFilter, statusFilter])

  const summary = useMemo(() => {
    const monthItems = transactions.filter(item => item.due_date?.startsWith(monthFilter))
    const income = monthItems.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
    const paidExpenses = monthItems.filter(item => item.type === 'expense' && item.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
    const pendingExpenses = monthItems.filter(item => item.type === 'expense' && item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0)
    return {
      income,
      paidExpenses,
      pendingExpenses,
      expectedBalance: income - paidExpenses - pendingExpenses
    }
  }, [transactions, monthFilter])

  if (loading) return <main className="screen"><p>Carregando...</p></main>

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <h1>Finanças</h1>
          <p>Organização simples para contas da casa.</p>

          <input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />

          <button onClick={signIn}>Entrar</button>
          <button className="secondary" onClick={signUp}>Criar conta</button>

          {message && <p className="message">{message}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <h1>Finanças</h1>
          <p>Logado como {session.user.email}</p>
        </div>
        <button className="secondary fit" onClick={signOut}>Sair</button>
      </header>

      <section className="summary-grid">
        <article className="card"><span>Receitas</span><strong>{formatMoney(summary.income)}</strong></article>
        <article className="card"><span>Despesas pagas</span><strong>{formatMoney(summary.paidExpenses)}</strong></article>
        <article className="card"><span>Pendentes</span><strong>{formatMoney(summary.pendingExpenses)}</strong></article>
        <article className="card"><span>Saldo previsto</span><strong>{formatMoney(summary.expectedBalance)}</strong></article>
      </section>

      <section className="layout">
        <form className="panel" onSubmit={createTransaction}>
          <h2>Novo lançamento</h2>

          <input placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <input placeholder="Valor" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />

          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>

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

          <select value={form.person} onChange={e => setForm({ ...form, person: e.target.value })}>
            <option>Eu</option>
            <option>Esposa</option>
            <option>Casal</option>
          </select>

          <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />

          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="pending">Pendente</option>
            <option value="paid">Pago/recebido</option>
          </select>

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

          <button type="submit">Adicionar</button>
          {message && <p className="message">{message}</p>}
        </form>

        <section className="panel">
          <div className="list-header">
            <h2>Lançamentos</h2>
            <div className="filters">
              <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos</option>
              </select>
            </div>
          </div>

          <div className="list">
            {filteredTransactions.length === 0 && <p className="muted">Nenhum lançamento nesse filtro.</p>}

            {filteredTransactions.map(item => (
              <article className="transaction" key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <span>{item.category} • {item.person} • {item.due_date}</span>
                </div>
                <div className="transaction-actions">
                  <strong className={item.type === 'income' ? 'positive' : 'negative'}>{formatMoney(item.amount)}</strong>
                  <span className={`badge ${item.status}`}>{item.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                  {item.status === 'pending' && <button className="small" onClick={() => markAsPaid(item.id)}>Pagar</button>}
                  <button className="small danger" onClick={() => deleteTransaction(item.id)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
