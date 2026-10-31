/**
 * Data model for the question bank (JSON files in /public/data) and for an
 * in-progress / completed test attempt.
 */

// ---------------------------------------------------------------------------
// Question bank (what lives in the JSON files)
// ---------------------------------------------------------------------------

export interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  prompt: string
  /** Exactly 4 options. Order in the JSON doesn't matter – options are shuffled per attempt. */
  options: [string, string, string, string]
  /** Index into `options` (as written in the JSON) of the best answer. */
  answer: number
  rationale?: string
}

export interface RankedAnswer {
  /** Canonical answer shown to the user, e.g. "Naloxone". */
  text: string
  /** Extra spellings / brand names that are also accepted, e.g. ["Narcan"]. */
  aliases?: string[]
}

export interface ShortAnswerQuestion {
  type: 'short-answer'
  prompt: string
  /** Accepted answers ordered best (#1) → acceptable. At least one entry. */
  answers: RankedAnswer[]
  rationale?: string
  /** 'number' strictly restricts input to numerical values; 'text' for generic words. Defaults to 'text'. */
  inputType?: 'number' | 'text'
}

export type StepQuestion = MultipleChoiceQuestion | ShortAnswerQuestion

/** A standalone question in the bank. */
export type StandaloneQuestion = StepQuestion & { id: string; topic?: string }

export interface CaseStudyStage {
  /** New information revealed at this stage (vitals change, new symptoms…). Omitted on the first stage. */
  update?: string
  question: StepQuestion
}

/** Unfolding case study: an initial scenario followed by ordered stages. */
export interface CaseStudy {
  id: string
  type: 'case-study'
  title: string
  topic?: string
  scenario: string
  stages: CaseStudyStage[]
}

export type BankItem = StandaloneQuestion | CaseStudy

export interface QuestionBank {
  categoryId: string
  items: BankItem[]
}

export interface Category {
  id: string
  name: string
  description: string
  /** Path (relative to the site root) of the question bank JSON. */
  bankUrl: string
  questionsPerTest: number
  timeLimitMinutes: number
}

export interface CategoriesFile {
  categories: Category[]
}

// ---------------------------------------------------------------------------
// Test attempt (what the app builds at runtime)
// ---------------------------------------------------------------------------

export interface CaseContext {
  caseId: string
  title: string
  scenario: string
  /** 0-based stage index and total number of stages. */
  stageIndex: number
  stageCount: number
  /** Updates from all stages up to and including this one, oldest first. */
  updates: string[]
}

interface TestQuestionBase {
  /** Unique within an attempt. */
  key: string
  prompt: string
  rationale?: string
  case?: CaseContext
}

export interface TestMultipleChoice extends TestQuestionBase {
  type: 'multiple-choice'
  /** Shuffled options for this attempt. */
  options: string[]
  /** Index into the shuffled `options`. */
  answer: number
}

export interface TestShortAnswer extends TestQuestionBase {
  type: 'short-answer'
  answers: RankedAnswer[]
  inputType?: 'number' | 'text'
}

export type TestQuestion = TestMultipleChoice | TestShortAnswer

/** Option index for multiple choice, typed text for short answer. */
export type Response = number | string

export interface ShortAnswerGrade {
  correct: boolean
  /** 1-based rank of the matched answer, if correct. */
  rank?: number
}

export interface QuestionResult {
  question: TestQuestion
  response?: Response
  correct: boolean
  /** Only set for short-answer questions that were answered correctly. */
  rank?: number
}

export interface Attempt {
  categoryId: string
  categoryName: string
  questions: TestQuestion[]
  responses: Record<string, Response>
  flagged: Record<string, boolean>
  currentIndex: number
  startedAt: number
  /** Epoch ms at which time runs out. */
  endsAt: number
  /** Set once the test has been submitted (manually or by timer). */
  finishedAt?: number
  timedOut?: boolean
}
