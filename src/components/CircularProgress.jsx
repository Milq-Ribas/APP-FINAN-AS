import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function CircularProgress({
  percentage,
  spent,
  total,
  expectedProfit,
  expectedProfitRaw,
  isPrivate = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const visualPercentage = Math.min(percentage, 100)
  const offset = circumference - (visualPercentage / 100) * circumference

  let strokeColor = '#17b5a2'
  if (percentage > 80) strokeColor = '#ff5c5c'
  else if (percentage > 60) strokeColor = '#f59e0b'

  return (
    <article className="progress-card">
      <div
        className="progress-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
      >
        <span>Renda mensal comprometida</span>
        <ChevronDown size={20} className={`chevron ${isCollapsed ? 'rotate-180' : ''}`} />
      </div>

      {!isCollapsed && (
        <div className="progress-body">
          <div className="progress-container">
            <svg className="progress-svg" viewBox="0 0 110 110">
              <circle
                className="progress-bg"
                cx="55"
                cy="55"
                r={radius}
              />
              <circle
                className="progress-bar"
                cx="55"
                cy="55"
                r={radius}
                style={{
                  strokeDasharray: circumference,
                  '--offset': offset,
                  stroke: strokeColor
                }}
              />
            </svg>
            <div className="progress-text">
              <strong>{percentage}%</strong>
            </div>
          </div>
          <div className="progress-labels">
            <span>{spent} / {total}</span>
            <small>Total comprometido</small>
          </div>
          <div className="expected-profit-row">
            <span>Lucro previsto:</span>
            <strong className={expectedProfitRaw < 0 ? 'profit-negative' : 'profit-positive'}>
              {expectedProfit}
            </strong>
          </div>
        </div>
      )}
    </article>
  )
}
