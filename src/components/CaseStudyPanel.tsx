import { useState } from 'react'
import type { CaseContext } from '../types'
import { ActivityIcon, ChevronDownIcon, ClipboardIcon } from './Icons'

interface CaseStudyPanelProps {
  context: CaseContext
  /** Start collapsed (used in the results review). */
  defaultOpen?: boolean
}

/** Shows the case scenario plus the timeline of updates revealed so far. */
export function CaseStudyPanel({ context, defaultOpen = true }: CaseStudyPanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const latest = context.updates.length - 1
  const hasNewUpdate = context.stageIndex > 0 && latest >= 0

  return (
    <section className={`case-panel ${open ? 'is-open' : ''}`} aria-label="Unfolding case study">
      <button type="button" className="case-panel__header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="case-panel__icon">
          <ClipboardIcon size={18} />
        </span>
        <span className="case-panel__titles">
          <span className="case-panel__eyebrow">
            Unfolding case study · Part {context.stageIndex + 1} of {context.stageCount}
          </span>
          <span className="case-panel__title">{context.title}</span>
        </span>
        <ChevronDownIcon className="case-panel__chevron" />
      </button>

      <div className="stage-dots" aria-hidden="true">
        {Array.from({ length: context.stageCount }, (_, i) => (
          <span key={i} className={`stage-dot ${i < context.stageIndex ? 'done' : ''} ${i === context.stageIndex ? 'current' : ''}`} />
        ))}
      </div>

      {open && (
        <div className="case-panel__body">
          <p className="case-panel__scenario">{context.scenario}</p>
          {context.updates.length > 0 && (
            <ol className="case-timeline">
              {context.updates.map((u, i) => (
                <li key={i} className={`case-timeline__item ${hasNewUpdate && i === latest ? 'is-new' : ''}`}>
                  <span className="case-timeline__marker">
                    <ActivityIcon size={14} />
                  </span>
                  <div>
                    <span className="case-timeline__label">{hasNewUpdate && i === latest ? 'New update' : `Update ${i + 1}`}</span>
                    <p>{u}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      {!open && hasNewUpdate && (
        <div className="case-panel__body case-panel__body--collapsed">
          <span className="case-timeline__label">Latest update</span>
          <p>{context.updates[latest]}</p>
        </div>
      )}
    </section>
  )
}
