import React from 'react'
import { ChevronDown } from 'lucide-react'
import { getMonthLabel } from '../utils/date'

export function MonthSelector({ value, onChange, compact = false }) {
  return (
    <label className={`month-selector ${compact ? 'compact' : ''}`}>
      <span>{getMonthLabel(value)}</span>
      <input
        type="month"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Selecionar mês"
      />
      <ChevronDown className="chevron" size={20} strokeWidth={2.4} />
    </label>
  )
}
