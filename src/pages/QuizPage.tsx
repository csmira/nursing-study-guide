import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from '@tanstack/react-router'
import { AppHeader } from '../components/AppHeader'
import { CaseStudyPanel } from '../components/CaseStudyPanel'
import { Dialog } from '../components/Dialog'
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, FlagIcon, GridIcon, XIcon } from '../components/Icons'
import { MultipleChoiceInput, ShortAnswerInput } from '../components/QuestionInputs'
import { QuestionNavigator } from '../components/QuestionNavigator'
import { useQuiz } from '../context/QuizContext'
import { formatDuration, useCountdown } from '../hooks/quiz'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { isAnswered } from '../lib/quiz'

export function QuizPage() {
  const { attempt, answer, toggleFlag, goTo, submit } = useQuiz()
  const navigate = useNavigate()
  const remaining = useCountdown(attempt?.endsAt, !!attempt && !attempt.finishedAt)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const finished = !!attempt?.finishedAt

  // Auto-submit when the timer runs out.
  useEffect(() => {
    if (attempt && !finished && remaining <= 0) submit(true)
  }, [attempt, finished, remaining, submit])

  useEffect(() => {
    if (finished) void navigate({ to: '/results', replace: true })
  }, [finished, navigate])

  // Move focus/scroll to the new question for keyboard & screen-reader users.
  const currentIndex = attempt?.currentIndex ?? 0
  useEffect(() => {
    window.scrollTo({ top: 0 })
    headingRef.current?.focus({ preventScroll: true })
  }, [currentIndex])

  // Lock background page scroll while the mobile question navigator is open.
  useEffect(() => {
    if (isDesktop || !navOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isDesktop, navOpen])

  const question = attempt?.questions[currentIndex]

  // Keyboard shortcuts: A–D / 1–4 select, ←/→ navigate, F flags.
  useEffect(() => {
    if (!attempt || !question) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || confirmOpen || navOpen) return
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      const k = e.key.toLowerCase()
      if (k === 'arrowright') goTo(currentIndex + 1)
      else if (k === 'arrowleft') goTo(currentIndex - 1)
      else if (k === 'f') toggleFlag(question.key)
      else if (question.type === 'multiple-choice') {
        const idx = 'abcd'.indexOf(k) !== -1 ? 'abcd'.indexOf(k) : '1234'.indexOf(k)
        if (idx !== -1 && idx < question.options.length) answer(question.key, idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [attempt, question, currentIndex, confirmOpen, navOpen, goTo, toggleFlag, answer])

  if (!attempt) return <Navigate to="/" replace />
  if (!question) return null

  const total = attempt.questions.length
  const isLast = currentIndex === total - 1
  const response = attempt.responses[question.key]
  const flagged = !!attempt.flagged[question.key]
  const answeredCount = attempt.questions.filter((q) => isAnswered(attempt.responses[q.key])).length
  const unanswered = total - answeredCount
  const flaggedCount = attempt.questions.filter((q) => attempt.flagged[q.key]).length
  const timerState = remaining <= 60_000 ? 'is-critical' : remaining <= 5 * 60_000 ? 'is-warning' : ''

  const next = () => (isLast ? setConfirmOpen(true) : goTo(currentIndex + 1))
  const selectFromNav = (i: number) => {
    goTo(i)
    setNavOpen(false)
  }

  return (
    <div className="page page--quiz">
      <AppHeader>
        <div className="quiz-header">
          <span className="quiz-header__title">{attempt.categoryName}</span>
          <span className={`timer ${timerState}`} role="timer" aria-live="off" aria-label={`Time remaining ${formatDuration(remaining)}`}>
            <ClockIcon size={16} />
            {formatDuration(remaining)}
          </span>
        </div>
      </AppHeader>

      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount} aria-label="Questions answered">
        <div className="progress__bar" style={{ width: `${(answeredCount / total) * 100}%` }} />
      </div>

      <div className="quiz-layout container">
        <main className={`quiz-main ${question.case ? 'has-case' : ''}`}>
          {question.case && (
            <CaseStudyPanel
              key={question.key}
              context={question.case}
              defaultOpen={isDesktop || question.case.stageIndex === 0}
            />
          )}

          <article className="card question-card">
            <header className="question-card__header">
              <div className="question-card__meta">
                <h1 className="question-card__number" ref={headingRef} tabIndex={-1}>
                  Question {currentIndex + 1} <span className="muted">of {total}</span>
                </h1>
              </div>
              <button
                type="button"
                className={`btn btn--ghost btn--sm flag-btn ${flagged ? 'is-flagged' : ''}`}
                onClick={() => toggleFlag(question.key)}
                aria-pressed={flagged}
              >
                <FlagIcon size={16} filled={flagged} />
                <span>{flagged ? 'Flagged' : 'Flag'}</span>
              </button>
            </header>

            <p className="question-card__prompt">{question.prompt}</p>

            {question.type === 'multiple-choice' ? (
              <MultipleChoiceInput question={question} value={response} onChange={(i) => answer(question.key, i)} />
            ) : (
              <ShortAnswerInput
                question={question}
                value={response}
                onChange={(t) => answer(question.key, t.length ? t : undefined)}
                onSubmit={next}
              />
            )}

            {isAnswered(response) && question.type === 'multiple-choice' && (
              <button type="button" className="link-btn clear-btn" onClick={() => answer(question.key, undefined)}>
                Clear selection
              </button>
            )}
          </article>

          {isDesktop && (
            <p className="shortcut-hint muted">
              Shortcuts: <kbd>A</kbd>–<kbd>D</kbd> select · <kbd>←</kbd>/<kbd>→</kbd> navigate · <kbd>F</kbd> flag
            </p>
          )}
        </main>

        {isDesktop && (
          <aside className="quiz-sidebar">
            <div className="card">
              <QuestionNavigator attempt={attempt} onSelect={selectFromNav} />
              <button type="button" className="btn btn--primary btn--block" onClick={() => setConfirmOpen(true)}>
                Submit test
              </button>
            </div>
          </aside>
        )}
      </div>

      <footer className="quiz-footer">
        <div className="quiz-footer__inner container">
          <button type="button" className="btn btn--secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
            <ChevronLeftIcon size={18} />
            <span className="hide-xs">Previous</span>
          </button>

          {!isDesktop && (
            <button type="button" className="btn btn--ghost nav-toggle" onClick={() => setNavOpen(true)} aria-label="Open question navigator">
              <GridIcon size={18} />
              <span>
                {currentIndex + 1}/{total}
              </span>
            </button>
          )}

          <button type="button" className={`btn ${isLast ? 'btn--success' : 'btn--primary'}`} onClick={next}>
            <span className={isLast ? '' : 'hide-xs'}>{isLast ? 'Submit' : 'Next'}</span>
            {!isLast && <ChevronRightIcon size={18} />}
          </button>
        </div>
      </footer>

      {!isDesktop && navOpen && (
        <div className="sheet-backdrop" onClick={() => setNavOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Question navigator" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__header">
              <h2>Questions</h2>
              <button type="button" className="icon-btn" onClick={() => setNavOpen(false)} aria-label="Close navigator">
                <XIcon />
              </button>
            </div>
            <QuestionNavigator attempt={attempt} onSelect={selectFromNav} />
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => {
                setNavOpen(false)
                setConfirmOpen(true)
              }}
            >
              Submit test
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={confirmOpen}
        title="Submit your test?"
        onClose={() => setConfirmOpen(false)}
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmOpen(false)}>
              Keep working
            </button>
            <button type="button" className="btn btn--primary" onClick={() => submit(false)}>
              Submit test
            </button>
          </>
        }
      >
        <p>
          You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions with{' '}
          <strong>{formatDuration(remaining)}</strong> remaining.
        </p>
        {unanswered > 0 && (
          <p className="warning-text">
            {unanswered} unanswered question{unanswered === 1 ? '' : 's'} will be marked incorrect.
          </p>
        )}
        {flaggedCount > 0 && (
          <p className="muted">
            {flaggedCount} question{flaggedCount === 1 ? ' is' : 's are'} still flagged for review.
          </p>
        )}
      </Dialog>
    </div>
  )
}
