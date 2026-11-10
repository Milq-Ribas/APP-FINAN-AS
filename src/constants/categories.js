import React from 'react'
import {
  Home,
  ShoppingCart,
  Car,
  Smartphone,
  Zap,
  CreditCard,
  Sparkles,
  HeartPulse,
  GraduationCap,
  Banknote,
  TrendingUp,
  Package,
  Tag
} from 'lucide-react'

export const categoryOptions = [
  { name: 'Moradia', Icon: Home },
  { name: 'Mercado', Icon: ShoppingCart },
  { name: 'Transporte', Icon: Car },
  { name: 'Internet/Telefone', Icon: Smartphone },
  { name: 'Energia/Água', Icon: Zap },
  { name: 'Cartão', Icon: CreditCard },
  { name: 'Lazer', Icon: Sparkles },
  { name: 'Saúde', Icon: HeartPulse },
  { name: 'Educação', Icon: GraduationCap },
  { name: 'Salário', Icon: Banknote },
  { name: 'Investimentos', Icon: TrendingUp },
  { name: 'Outros', Icon: Package }
]

export function getCategoryIcon(name, props = {}) {
  const cat = categoryOptions.find(c => c.name === name)
  const IconComponent = cat ? cat.Icon : Tag
  return React.createElement(IconComponent, {
    size: props.size || 16,
    strokeWidth: props.strokeWidth || 2,
    className: props.className || ''
  })
}

export const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48]

export const CHART_COLORS = [
  '#10b981', '#34d399', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#f87171', '#64748b'
]
