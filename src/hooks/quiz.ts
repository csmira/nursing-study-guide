import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { bankQuery, categoriesQuery } from '../data/queries'
import { useQuiz } from '../context/QuizContext'

/** Loads the category's question bank (cached by TanStack Query), builds a new attempt, and opens it. */
export function useStartTest() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { start } = useQuiz()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startTest = useCallback(
    async (categoryId: string) => {
      setPending(categoryId)
      setError(null)
      try {
        const categories = await queryClient.ensureQueryData(categoriesQuery)
        const category = categories.find((c) => c.id === categoryId)
        if (!category) throw new Error(`Unknown category "${categoryId}"`)
        const bank = await queryClient.ensureQueryData(bankQuery(category))
        const attempt = start(category, bank)
        if (attempt.questions.length === 0) throw new Error('This question bank is empty.')
        await navigate({ to: '/quiz' })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setPending(null)
      }
    },
    [queryClient, navigate, start],
  )

  return { startTest, pending, error }
}

/** Milliseconds remaining until `endsAt`, updated every second (never negative). */
export function useCountdown(endsAt: number | undefined, active: boolean) {
  const calc = () => (endsAt ? Math.max(0, endsAt - Date.now()) : 0)
  const [remaining, setRemaining] = useState(calc)

  useEffect(() => {
    setRemaining(calc())
    if (!active || !endsAt) return
    const id = window.setInterval(() => setRemaining(calc()), 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, active])

  return remaining
}

export function formatDuration(ms: number) {
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
