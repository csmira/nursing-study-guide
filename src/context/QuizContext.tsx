import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { createAttempt } from '../lib/quiz'
import type { Attempt, Category, QuestionBank, Response } from '../types'

type Action =
  | { type: 'start'; attempt: Attempt }
  | { type: 'answer'; key: string; response: Response | undefined }
  | { type: 'toggleFlag'; key: string }
  | { type: 'goTo'; index: number }
  | { type: 'submit'; timedOut: boolean }
  | { type: 'clear' }

function reducer(state: Attempt | null, action: Action): Attempt | null {
  if (action.type === 'start') return action.attempt
  if (action.type === 'clear') return null
  if (!state) return state
  // A submitted attempt is read-only.
  if (state.finishedAt) return state

  switch (action.type) {
    case 'answer': {
      const responses = { ...state.responses }
      if (action.response === undefined) delete responses[action.key]
      else responses[action.key] = action.response
      return { ...state, responses }
    }
    case 'toggleFlag':
      return { ...state, flagged: { ...state.flagged, [action.key]: !state.flagged[action.key] } }
    case 'goTo': {
      const index = Math.max(0, Math.min(state.questions.length - 1, action.index))
      return index === state.currentIndex ? state : { ...state, currentIndex: index }
    }
    case 'submit':
      return { ...state, finishedAt: Date.now(), timedOut: action.timedOut }
  }
}

const STORAGE_KEY = 'nsg-attempt'

function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Attempt
    return Array.isArray(parsed.questions) && typeof parsed.endsAt === 'number' ? parsed : null
  } catch {
    return null
  }
}

interface QuizContextValue {
  attempt: Attempt | null
  start: (category: Category, bank: QuestionBank) => Attempt
  answer: (key: string, response: Response | undefined) => void
  toggleFlag: (key: string) => void
  goTo: (index: number) => void
  submit: (timedOut?: boolean) => void
  clear: () => void
}

const QuizContext = createContext<QuizContextValue | null>(null)

export function QuizProvider({ children }: { children: ReactNode }) {
  const [attempt, dispatch] = useReducer(reducer, null, loadAttempt)

  // Persist so a refresh (or accidental tab close) doesn't lose progress.
  useEffect(() => {
    if (attempt) localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
    else localStorage.removeItem(STORAGE_KEY)
  }, [attempt])

  const value = useMemo<QuizContextValue>(
    () => ({
      attempt,
      start: (category, bank) => {
        const next = createAttempt(category, bank)
        dispatch({ type: 'start', attempt: next })
        return next
      },
      answer: (key, response) => dispatch({ type: 'answer', key, response }),
      toggleFlag: (key) => dispatch({ type: 'toggleFlag', key }),
      goTo: (index) => dispatch({ type: 'goTo', index }),
      submit: (timedOut = false) => dispatch({ type: 'submit', timedOut }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [attempt],
  )

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuiz must be used inside <QuizProvider>')
  return ctx
}
