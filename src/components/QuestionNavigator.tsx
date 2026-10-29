import { isAnswered } from '../lib/quiz'
import type { Attempt } from '../types'
import { FlagIcon } from './Icons'

interface QuestionNavigatorProps {
  attempt: Attempt
  onSelect: (index: number) => void
}

/** Grid of question numbers showing answered / flagged / current state. */
export function QuestionNavigator({ attempt, onSelect }: QuestionNavigatorProps) {
  const answered = attempt.questions.filter((q) => isAnswered(attempt.responses[q.key])).length
  const flagged = attempt.questions.filter((q) => attempt.flagged[q.key]).length

  return (
    <nav className="navigator" aria-label="Question navigator">
      <div className="navigator__stats">
        <span>
          <strong>{answered}</strong> / {attempt.questions.length} answered
        </span>
        {flagged > 0 && (
          <span className="navigator__flagged">
            <FlagIcon size={14} filled /> {flagged}
          </span>
        )}
      </div>
      <ol className="navigator__grid">
        {attempt.questions.map((q, i) => {
          const isCurrent = i === attempt.currentIndex
          const done = isAnswered(attempt.responses[q.key])
          const isFlagged = !!attempt.flagged[q.key]
          const classes = ['nav-cell', done && 'is-answered', isCurrent && 'is-current', isFlagged && 'is-flagged', q.case && 'is-case']
            .filter(Boolean)
            .join(' ')
          const status = [done ? 'answered' : 'unanswered', isFlagged && 'flagged', q.case && 'case study'].filter(Boolean).join(', ')
          return (
            <li key={q.key}>
              <button
                type="button"
                className={classes}
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Question ${i + 1}, ${status}`}
              >
                {i + 1}
                {isFlagged && <FlagIcon size={10} filled className="nav-cell__flag" />}
              </button>
            </li>
          )
        })}
      </ol>
      <ul className="navigator__legend" aria-hidden="true">
        <li>
          <span className="legend-swatch is-answered" /> Answered
        </li>
        <li>
          <span className="legend-swatch" /> Unanswered
        </li>
        <li>
          <span className="legend-swatch is-case" /> Case study
        </li>
      </ul>
    </nav>
  )
}
