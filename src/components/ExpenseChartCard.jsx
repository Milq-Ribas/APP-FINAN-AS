import React, { useState } from 'react'
import { ChevronDown, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategoryIcon } from '../constants/categories'
import { formatMoney } from '../utils/formatters'

export function ExpenseChartCard({ expensesByCategory, CHART_COLORS, isPrivate = false }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!expensesByCategory || expensesByCategory.length === 0) return null

  const totalExpenseSum = expensesByCategory.reduce((sum, item) => sum + Number(item.value || 0), 0)

  return (
    <div className="chart-container progress-card ds-card">
      <div
        className="progress-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        style={{
          padding: '16px 18px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="ds-card-title-group">
          <span className="ds-header-icon">
            <PieChartIcon size={16} strokeWidth={2.2} />
          </span>
          <span>Despesas por Categoria</span>
        </div>
        <ChevronDown size={18} className={`chevron ${isCollapsed ? 'rotate-180' : ''}`} />
      </div>

      {!isCollapsed && (
        <div style={{ padding: '0 18px 18px 18px' }}>
          <ResponsiveContainer width="100%" height={200} style={{ marginTop: '10px' }}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={76}
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
                  backgroundColor: '#13151c',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }}
                itemStyle={{ color: '#f4f4f4', fontWeight: 700 }}
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
                    <span className="legend-cat-icon" style={{ color }}>
                      {getCategoryIcon(cat.name, { size: 14, strokeWidth: 2.2 })}
                    </span>
                    <span className="legend-name">{cat.name}</span>
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
