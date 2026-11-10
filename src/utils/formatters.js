import { today } from './date'

export function roundMoney(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num)) return 0
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

export function formatMoney(value, isPrivate = false) {
  if (isPrivate) {
    return 'R$ •••••'
  }
  const num = roundMoney(value)
  if (num < 0) {
    const formatted = Math.abs(num).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
    return `- ${formatted}`
  }
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export function formatSignedMoney(value, type = 'expense', isPrivate = false) {
  if (isPrivate) {
    return 'R$ •••••'
  }
  const num = Math.abs(roundMoney(value))
  const formatted = num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
  return type === 'expense' ? `-${formatted}` : `+${formatted}`
}

export function getInstallmentsLabel(item) {
  if (item.installment_total && Number(item.installment_total) > 1) {
    return `Parcela ${item.installment_current || 1}/${item.installment_total}`
  }

  if (item.recurrence === 'monthly') return 'Recorrente mensal'
  if (item.recurrence === 'weekly') return 'Recorrente semanal'

  return item.category || 'Lançamento'
}

export function getTransactionState(item) {
  const isIncome = item.type === 'income'
  const isPaid = item.status === 'paid'
  const isOverdue = !isPaid && item.due_date < today

  if (isOverdue) return { label: 'Atrasado', className: 'overdue' }
  if (isPaid && isIncome) return { label: 'Recebido', className: 'paid income-paid' }
  if (isPaid) return { label: 'Pago', className: 'paid expense-paid' }
  if (isIncome) return { label: 'A receber', className: 'income-pending' }
  return { label: 'A pagar', className: 'expense-pending' }
}
