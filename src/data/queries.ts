import { queryOptions, useQuery } from '@tanstack/react-query'
import type { CategoriesFile, Category, QuestionBank } from '../types'

/** Resolve a path in /public relative to the app's base URL. */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(asset(path))
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)
  return (await res.json()) as T
}

export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: () => fetchJson<CategoriesFile>('data/categories.json').then((f) => f.categories),
  staleTime: Infinity,
})

export const bankQuery = (category: Category) =>
  queryOptions({
    queryKey: ['bank', category.id],
    queryFn: () => fetchJson<QuestionBank>(category.bankUrl),
    staleTime: Infinity,
  })

export const useCategories = () => useQuery(categoriesQuery)
