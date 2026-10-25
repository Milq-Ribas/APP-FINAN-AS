import { today } from './date'

export function formatMoney(value, isPrivate = false) {
  if (isPrivate) {
    return 'R$ •••••'
  }
  const num = Number(value || 0)
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

export function getInstallmentsLabel(item) {
  if (item.installment_total && Number(item.installment_total) > 1) {
    return `${item.installment_current || 1} / ${item.installment_total} X`
  }

  if (item.recurrence === 'monthly') return 'RECORRENTE MENSAL'
  if (item.recurrence === 'weekly') return 'RECORRENTE SEMANAL'

  return item.category?.toUpperCase() || 'LANÇAMENTO'
}

export function getTransactionState(item) {
  const isIncome = item.type === 'income'
  const isPaid = item.status === 'paid'
  const isOverdue = !isPaid && item.due_date < today

  if (isOverdue) return { label: 'ATRASADO', className: 'overdue' }
  if (isPaid && isIncome) return { label: 'RECEBIDO', className: 'paid income-paid' }
  if (isPaid) return { label: 'PAGO', className: 'paid expense-paid' }
  if (isIncome) return { label: 'A RECEBER', className: 'income-pending' }
  return { label: 'A PAGAR', className: 'expense-pending' }
}
