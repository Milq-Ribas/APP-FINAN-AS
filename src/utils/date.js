function formatLocalDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const today = formatLocalDate(new Date())
export const currentMonth = today.slice(0, 7)

export const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function addMonths(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const targetMonthIndex = month - 1 + amount
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12
  // Último dia do mês de destino para evitar pular meses (ex: 31 de jan -> 28 de fev)
  const maxDayInMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate()
  const clampedDay = Math.min(day, maxDayInMonth)
  const date = new Date(targetYear, normalizedMonth, clampedDay)
  return formatLocalDate(date)
}

export function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day + amount)
  return formatLocalDate(date)
}

export function addWeeks(dateString, amount) {
  return addDays(dateString, amount * 7)
}

export function getMonthLabel(monthValue) {
  const [year, month] = (monthValue || currentMonth).split('-').map(Number)
  const monthName = monthNames[month - 1] || 'Mês'
  const currentYear = new Date().getFullYear()
  if (year && year !== currentYear) {
    return `${monthName.slice(0, 3)}/${String(year).slice(-2)}`
  }
  return monthName
}

export function getDayLabel(dateString) {
  if (!dateString) return ''
  const [, month, day] = dateString.split('-').map(Number)
  return `${day} de ${monthNames[month - 1]}`
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
