import { createHashHistory, createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { HomePage } from './pages/HomePage'
import { QuizPage } from './pages/QuizPage'
import { ResultsPage } from './pages/ResultsPage'

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <main className="container empty">
      <h1>Page not found</h1>
      <Link to="/" className="btn btn--primary">
        Go home
      </Link>
    </main>
  ),
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const quizRoute = createRoute({ getParentRoute: () => rootRoute, path: '/quiz', component: QuizPage })
const resultsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/results', component: ResultsPage })

const routeTree = rootRoute.addChildren([homeRoute, quizRoute, resultsRoute])

// Hash history keeps the app fully static: any file host works without SPA rewrites.
export const router = createRouter({ routeTree, history: createHashHistory() })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
