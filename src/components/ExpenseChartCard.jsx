import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategoryIcon } from '../constants/categories'
import { formatMoney } from '../utils/formatters'

export function ExpenseChartCard({ expensesByCategory, CHART_COLORS, isPrivate = false }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!expensesByCategory || expensesByCategory.length === 0) return null

  const totalExpenseSum = expensesByCategory.reduce((sum, item) => sum + Number(item.value || 0), 0)

  return (
    <div
      className="chart-container progress-card"
      style={{
        padding: '0',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div
        className="progress-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        style={{
          padding: '18px 20px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <span>Despesas por Categoria</span>
        <ChevronDown size={20} className={`chevron ${isCollapsed ? 'rotate-180' : ''}`} />
      </div>

      {!isCollapsed && (
        <div style={{ padding: '0 20px 20px 20px' }}>
          <ResponsiveContainer width="100%" height={210} style={{ marginTop: '12px' }}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={78}
                paddingAngle={4}
              >
                {expensesByCategory.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(value, isPrivate)}
                contentStyle={{
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="chart-legend-grid">
            {expensesByCategory.map((cat, index) => {
              const pct = totalExpenseSum > 0 ? Math.round((Number(cat.value) / totalExpenseSum) * 100) : 0
              const color = CHART_COLORS[index % CHART_COLORS.length]

              return (
                <div key={cat.name} className="legend-item">
                  <div className="legend-dot-group">
                    <span className="legend-dot" style={{ backgroundColor: color }}></span>
                    <span className="legend-name">{getCategoryIcon(cat.name)} {cat.name}</span>
                  </div>
                  <div className="legend-value-group">
                    <strong className="legend-amount">{formatMoney(cat.value, isPrivate)}</strong>
                    <span className="legend-pct">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
