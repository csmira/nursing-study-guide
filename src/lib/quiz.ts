import type {
  Attempt,
  BankItem,
  Category,
  QuestionBank,
  QuestionResult,
  RankedAnswer,
  Response,
  ShortAnswerGrade,
  StepQuestion,
  TestQuestion,
} from '../types'

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

/** Max share of a test made up of case-study questions (unless the bank lacks standalone questions). */
export const CASE_STUDY_SHARE = 0.4

const itemSize = (item: BankItem) => (item.type === 'case-study' ? item.stages.length : 1)

function toTestQuestion(q: StepQuestion, key: string, extra: Partial<TestQuestion> = {}): TestQuestion {
  if (q.type === 'multiple-choice') {
    const order = shuffle(q.options.map((_, i) => i))
    return {
      key,
      type: 'multiple-choice',
      prompt: q.prompt,
      rationale: q.rationale,
      options: order.map((i) => q.options[i]!),
      answer: order.indexOf(q.answer),
      ...extra,
    } as TestQuestion
  }
  return {
    key,
    type: 'short-answer',
    prompt: q.prompt,
    rationale: q.rationale,
    answers: q.answers,
    inputType: q.inputType,
    placeholder: q.placeholder,
    helperText: q.helperText,
    ...extra,
  } as TestQuestion
}

/**
 * Builds a randomized test:
 *  - Standalone questions and whole case studies are shuffled together as "units",
 *    so a case study can start anywhere in the test.
 *  - Stages of a case study always stay consecutive and in their original order.
 *  - Multiple-choice options are shuffled every attempt.
 */
export function buildTest(bank: QuestionBank, target: number, caseShare = CASE_STUDY_SHARE): TestQuestion[] {
  const cases = shuffle(bank.items.filter((i) => i.type === 'case-study' && itemSize(i) > 0))
  const standalone = shuffle(bank.items.filter((i) => i.type !== 'case-study'))

  // Case studies are multi-question, so pick them first (within a budget) and fill the rest with
  // standalone questions. This hits the target exactly whenever the bank is large enough.
  const caseBudget = Math.max(Math.round(target * caseShare), target - standalone.length)
  const selected: BankItem[] = []
  let count = 0
  const take = (items: BankItem[], limit: number) => {
    for (const item of items) {
      if (selected.includes(item)) continue
      const size = itemSize(item)
      if (count + size > limit) continue
      selected.push(item)
      count += size
    }
  }
  take(cases, Math.min(caseBudget, target))
  take(standalone, target)
  take(cases, target) // not enough standalone questions: top up with any case study that still fits

  const questions: TestQuestion[] = []
  for (const item of shuffle(selected)) {
    if (item.type !== 'case-study') {
      questions.push(toTestQuestion(item, item.id))
      continue
    }
    const updates: string[] = []
    item.stages.forEach((stage, stageIndex) => {
      if (stage.update) updates.push(stage.update)
      questions.push(
        toTestQuestion(stage.question, `${item.id}#${stageIndex + 1}`, {
          case: {
            caseId: item.id,
            title: item.title,
            scenario: item.scenario,
            stageIndex,
            stageCount: item.stages.length,
            updates: updates.slice(),
          },
        }),
      )
    })
  }
  return questions
}

/** Total number of questions available in a bank. */
export const bankSize = (bank: QuestionBank) => bank.items.reduce((n, i) => n + itemSize(i), 0)

/** Time limit scaled down proportionally when the bank has fewer questions than a full test. */
export function timeLimitFor(category: Category, questionCount: number): number {
  if (questionCount >= category.questionsPerTest) return category.timeLimitMinutes
  return Math.max(1, Math.ceil((category.timeLimitMinutes * questionCount) / category.questionsPerTest))
}

export function createAttempt(category: Category, bank: QuestionBank): Attempt {
  const questions = buildTest(bank, category.questionsPerTest)
  const now = Date.now()
  return {
    categoryId: category.id,
    categoryName: category.name,
    questions,
    responses: {},
    flagged: {},
    currentIndex: 0,
    startedAt: now,
    endsAt: now + timeLimitFor(category, questions.length) * 60_000,
  }
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

/** Case/accent/punctuation/whitespace-insensitive comparison key. */
export const normalize = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

export function gradeShortAnswer(answers: RankedAnswer[], input: string): ShortAnswerGrade {
  const trimmed = input.trim()
  if (!trimmed) return { correct: false }

  const numInput = parseFloat(trimmed)
  const isInputNum = !Number.isNaN(numInput) && /^-?\d*(\.\d+)?$/.test(trimmed)

  const value = normalize(trimmed)
  const idx = answers.findIndex((a) =>
    [a.text, ...(a.aliases ?? [])].some((t) => {
      if (isInputNum) {
        const numTarget = parseFloat(t.trim())
        if (!Number.isNaN(numTarget) && numInput === numTarget) return true
      }
      return normalize(t) === value
    }),
  )
  return idx === -1 ? { correct: false } : { correct: true, rank: idx + 1 }
}

export const isAnswered = (r: Response | undefined) =>
  typeof r === 'number' || (typeof r === 'string' && r.trim().length > 0)

export function gradeAttempt(attempt: Attempt): QuestionResult[] {
  return attempt.questions.map((question) => {
    const response = attempt.responses[question.key]
    if (question.type === 'multiple-choice') {
      return { question, response, correct: response === question.answer }
    }
    const grade = typeof response === 'string' ? gradeShortAnswer(question.answers, response) : { correct: false }
    return { question, response, ...grade }
  })
}
