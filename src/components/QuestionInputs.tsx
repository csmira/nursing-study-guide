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

  const isNumeric =
    question.inputType === 'number' ||
    (question.inputType !== 'text' &&
      question.answers.length > 0 &&
      /^-?\d+(\.\d+)?$/.test(question.answers[0].text.trim()))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (isNumeric) {
      if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
        onChange(raw)
      }
    } else {
      onChange(raw)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
      return
    }
    if (isNumeric) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        return
      }
      if (/^[0-9]$/.test(e.key)) return
      if (e.key === '.' && !(typeof value === 'string' && value.includes('.'))) return
      if (e.key === '-' && (typeof value !== 'string' || value.length === 0)) return
      e.preventDefault()
    }
  }

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
        inputMode={isNumeric ? 'decimal' : 'text'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={question.placeholder ?? (isNumeric ? 'Enter a number…' : 'Type your answer…')}
        value={typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <p className="hint">
        {question.helperText ??
          (isNumeric
            ? 'Numbers only. Do not include units.'
            : 'Spelling counts.')}
      </p>
    </div>
  )
}

export { LETTERS }
