export const today = new Date().toISOString().slice(0, 10)
export const currentMonth = new Date().toISOString().slice(0, 7)

export const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function addMonths(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1 + amount, day)
  return date.toISOString().slice(0, 10)
}

export function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day + amount)
  return date.toISOString().slice(0, 10)
}

export function addWeeks(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + amount * 7)
  return date.toISOString().slice(0, 10)
}

export function getMonthLabel(monthValue) {
  const [, month] = (monthValue || currentMonth).split('-').map(Number)
  return monthNames[month - 1] || 'Mês'
}

export function getDayLabel(dateString) {
  if (!dateString) return ''
  const [, month, day] = dateString.split('-').map(Number)
  return `${day} de ${monthNames[month - 1]}`
}
