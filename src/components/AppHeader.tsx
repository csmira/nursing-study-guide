import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useTheme } from '../context/ThemeContext'
import { MonitorIcon, MoonIcon, SunIcon } from './Icons'

export function ThemeToggle() {
  const { preference, cycle } = useTheme()
  const label = { light: 'Light', dark: 'Dark', system: 'System' }[preference]
  const Icon = { light: SunIcon, dark: MoonIcon, system: MonitorIcon }[preference]
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={cycle}
      title={`Theme: ${label} (click to change)`}
      aria-label={`Theme: ${label}. Click to change.`}
    >
      <Icon />
    </button>
  )
}

interface AppHeaderProps {
  /** Rendered between the brand and the theme toggle. */
  children?: ReactNode
}

export function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="var(--brand-contrast)" />
            </svg>
          </span>
          <span className="brand-name">NurseQuiz</span>
        </Link>
        <div className="app-header__content">{children}</div>
        <ThemeToggle />
      </div>
    </header>
  )
}
