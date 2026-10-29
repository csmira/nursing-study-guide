import type { Response, TestMultipleChoice, TestShortAnswer } from '../types'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

interface MultipleChoiceProps {
  question: TestMultipleChoice
  value: Response | undefined
  onChange: (index: number) => void
}

export function MultipleChoiceInput({ question, value, onChange }: MultipleChoiceProps) {
  return (
    <div className="options" role="radiogroup" aria-label="Answer options">
      {question.options.map((option, i) => {
        const selected = value === i
        return (
          <label key={i} className={`option ${selected ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name={`q-${question.key}`}
              className="sr-only"
              checked={selected}
              onChange={() => onChange(i)}
            />
            <span className="option__letter" aria-hidden="true">
              {LETTERS[i]}
            </span>
            <span className="option__text">{option}</span>
          </label>
        )
      })}
    </div>
  )
}

interface ShortAnswerProps {
  question: TestShortAnswer
  value: Response | undefined
  onChange: (text: string) => void
  onSubmit?: () => void
}

export function ShortAnswerInput({ question, value, onChange, onSubmit }: ShortAnswerProps) {
  const id = `sa-${question.key}`
  return (
    <div className="short-answer">
      <label htmlFor={id} className="short-answer__label">
        Your answer
      </label>
      <input
        id={id}
        key={question.key}
        className="text-input"
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Type a single word or drug name…"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit?.()
          }
        }}
      />
      <p className="hint">Spelling counts. Generic or brand names are accepted. Press Enter to continue.</p>
    </div>
  )
}

export { LETTERS }
