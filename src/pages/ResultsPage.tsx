import { useMemo, useState } from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { AppHeader } from '../components/AppHeader'
import { CaseStudyPanel } from '../components/CaseStudyPanel'
import { CheckIcon, ClockIcon, FlagIcon, HomeIcon, RefreshIcon, XIcon } from '../components/Icons'
import { LETTERS } from '../components/QuestionInputs'
import { useQuiz } from '../context/QuizContext'
import { formatDuration, useStartTest } from '../hooks/quiz'
import { gradeAttempt, isAnswered } from '../lib/quiz'
import type { QuestionResult } from '../types'

type Filter = 'all' | 'answered' | 'incorrect' | 'correct' | 'flagged'

export function ResultsPage() {
  const { attempt } = useQuiz()
  const { startTest, pending, error } = useStartTest()
  const [filter, setFilter] = useState<Filter>('all')
  const results = useMemo(() => (attempt?.finishedAt ? gradeAttempt(attempt) : []), [attempt])

  if (!attempt) return <Navigate to="/" replace />
  if (!attempt.finishedAt) return <Navigate to="/quiz" replace />

  const total = results.length
  const correct = results.filter((r) => r.correct).length
  const pct = total ? Math.round((correct / total) * 100) : 0
  const elapsed = Math.min(attempt.finishedAt, attempt.endsAt) - attempt.startedAt
  const unanswered = results.filter((r) => !isAnswered(r.response)).length

  const filters: { id: Filter; label: string; match: (r: QuestionResult) => boolean }[] = [
    { id: 'all', label: 'All', match: () => true },
    { id: 'answered', label: 'Answered', match: (r) => isAnswered(r.response) },
    { id: 'incorrect', label: 'Incorrect', match: (r) => !r.correct },
    { id: 'correct', label: 'Correct', match: (r) => r.correct },
    { id: 'flagged', label: 'Flagged', match: (r) => !!attempt.flagged[r.question.key] },
  ]
  const active = filters.find((f) => f.id === filter)!
  const grade = pct >= 80 ? 'great' : pct >= 65 ? 'ok' : 'low'

  return (
    <div className="page">
      <AppHeader />
      <main className="container results">
        <section className="card score-card">
          <div className={`score-ring score-ring--${grade}`} style={{ ['--pct' as string]: pct }}>
            <div className="score-ring__inner">
              <span className="score-ring__pct">{pct}%</span>
              <span className="score-ring__label">score</span>
            </div>
          </div>
          <div className="score-card__details">
            <p className="eyebrow">{attempt.categoryName} · Results</p>
            <h1>
              {correct} of {total} correct
            </h1>
            {attempt.timedOut && (
              <p className="pill pill--warning">
                <ClockIcon size={14} /> Time ran out, so your test was submitted automatically
              </p>
            )}
            <ul className="meta">
              <li>
                <ClockIcon size={16} /> {formatDuration(elapsed)} used
              </li>
              {unanswered > 0 && <li>{unanswered} unanswered</li>}
            </ul>
            <div className="score-card__actions">
              <button type="button" className="btn btn--primary" disabled={!!pending} onClick={() => void startTest(attempt.categoryId)}>
                <RefreshIcon size={18} /> {pending ? 'Preparing…' : 'Start new test'}
              </button>
              <Link to="/" className="btn btn--secondary">
                <HomeIcon size={18} /> Home
              </Link>
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        </section>

        <section aria-labelledby="review-heading">
          <div className="review-toolbar">
            <h2 id="review-heading" className="section-title">
              Review
            </h2>
            <div className="segmented" role="tablist" aria-label="Filter questions">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  className={filter === f.id ? 'is-active' : ''}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label} <span className="segmented__count">{results.filter(f.match).length}</span>
                </button>
              ))}
            </div>
          </div>

          <ol className="review-list">
            {results.map((r, i) =>
              active.match(r) ? (
                <li key={r.question.key}>
                  <ReviewCard result={r} number={i + 1} flagged={!!attempt.flagged[r.question.key]} />
                </li>
              ) : null,
            )}
          </ol>
          {results.filter(active.match).length === 0 && <p className="muted empty">No questions match this filter.</p>}
        </section>
      </main>
    </div>
  )
}

function ReviewCard({ result, number, flagged }: { result: QuestionResult; number: number; flagged: boolean }) {
  const { question, response, correct, rank } = result
  const answered = isAnswered(response)

  return (
    <article className={`card review-card ${correct ? 'is-correct' : 'is-incorrect'}`}>
      <header className="review-card__header">
        <span className="review-card__number">Question {number}</span>
        <span className={`pill ${correct ? 'pill--success' : 'pill--danger'}`}>
          {correct ? <CheckIcon size={14} /> : <XIcon size={14} />}
          {correct ? 'Correct' : answered ? 'Incorrect' : 'Not answered'}
        </span>
        {flagged && (
          <span className="pill pill--neutral">
            <FlagIcon size={12} filled /> Flagged
          </span>
        )}
      </header>

      {question.case && <CaseStudyPanel context={question.case} defaultOpen={false} />}

      <p className="review-card__prompt">{question.prompt}</p>

      {question.type === 'multiple-choice' ? (
        <ul className="review-options">
          {question.options.map((opt, i) => {
            const isAnswer = i === question.answer
            const isChosen = response === i
            const cls = isAnswer ? 'is-answer' : isChosen ? 'is-wrong' : ''
            return (
              <li key={i} className={`review-option ${cls}`}>
                <span className="option__letter" aria-hidden="true">
                  {LETTERS[i]}
                </span>
                <span className="review-option__text">{opt}</span>
                <span className="review-option__tags">
                  {isChosen && <span className="tag">Your answer</span>}
                  {isAnswer && (
                    <span className="tag tag--success">
                      <CheckIcon size={12} /> Correct
                    </span>
                  )}
                  {isChosen && !isAnswer && <XIcon size={16} className="text-danger" />}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="review-short">
          <div className={`review-short__yours ${correct ? 'is-answer' : answered ? 'is-wrong' : ''}`}>
            <span className="muted">Your answer</span>
            <strong>{answered ? String(response) : '—'}</strong>
            {correct && rank && rank > 1 && <span className="tag">Accepted · ranked #{rank}</span>}
          </div>
          {correct && rank && rank > 1 && (
            <p className="note">
              Your answer is correct, but <strong>{question.answers[0]!.text}</strong> is the best answer. Here are all
              the accepted answers:
            </p>
          )}
          <ol className="ranked-answers">
            {question.answers.map((a, i) => (
              <li key={a.text} className={rank === i + 1 ? 'is-match' : ''}>
                <span className="ranked-answers__rank">#{i + 1}</span>
                <span>
                  <strong>{a.text}</strong>
                  {a.aliases && a.aliases.length > 0 && <span className="muted"> ({a.aliases.slice(0, 3).join(', ')})</span>}
                </span>
                <span className="ranked-answers__tags">
                  {i === 0 && <span className="tag tag--success">Best answer</span>}
                  {rank === i + 1 && <span className="tag">Your answer</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {question.rationale && (
        <div className="rationale">
          <span className="rationale__label">Rationale</span>
          <p>{question.rationale}</p>
        </div>
      )}
    </article>
  )
}
