export const categoryOptions = [
  { name: 'Moradia', icon: '🏠' },
  { name: 'Mercado', icon: '🛒' },
  { name: 'Transporte', icon: '🚌' },
  { name: 'Internet/Telefone', icon: '📱' },
  { name: 'Energia/Água', icon: '💡' },
  { name: 'Cartão', icon: '💳' },
  { name: 'Lazer', icon: '🎉' },
  { name: 'Saúde', icon: '⚕️' },
  { name: 'Educação', icon: '📚' },
  { name: 'Salário', icon: '💵' },
  { name: 'Investimentos', icon: '📈' },
  { name: 'Outros', icon: '📦' }
]

export function getCategoryIcon(name) {
  const cat = categoryOptions.find(c => c.name === name)
  return cat ? cat.icon : '🏷️'
}

export const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48]

export const CHART_COLORS = [
  '#17b5a2', '#ff5c5c', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#10b981', '#6366f1', '#14b8a6', '#64748b'
]
