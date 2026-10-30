import { Link } from "@tanstack/react-router";
import { AppHeader } from "../components/AppHeader";
import {
  ChevronRightIcon,
  ClipboardIcon,
  ClockIcon,
  PillIcon,
} from "../components/Icons";
import { useQuiz } from "../context/QuizContext";
import { useCategories } from "../data/queries";
import { useStartTest } from "../hooks/quiz";
import { isAnswered } from "../lib/quiz";

const CATEGORY_ICONS: Record<string, typeof PillIcon> = {
  pharmacology: PillIcon,
};

export function HomePage() {
  const { data: categories, isPending, error } = useCategories();
  const { attempt, clear } = useQuiz();
  const { startTest, pending, error: startError } = useStartTest();

  const inProgress = attempt && !attempt.finishedAt ? attempt : null;
  const lastResult = attempt?.finishedAt ? attempt : null;

  return (
    <div className="page">
      <AppHeader />
      <main className="container home">
        <section className="hero">
          <p className="eyebrow">Nursing exam practice</p>
          <h1>Nursing exam practice</h1>
          <p className="hero__lead">Timed, randomized practice tests</p>
        </section>

        {inProgress && (
          <div className="banner" role="status">
            <div>
              <strong>You have a test in progress.</strong>
              <span className="muted">
                {" "}
                {inProgress.categoryName} ·{" "}
                {
                  inProgress.questions.filter((q) =>
                    isAnswered(inProgress.responses[q.key]),
                  ).length
                }
                /{inProgress.questions.length} answered
              </span>
            </div>
            <div className="banner__actions">
              <button type="button" className="btn btn--ghost" onClick={clear}>
                Discard
              </button>
              <Link to="/quiz" className="btn btn--primary">
                Resume
              </Link>
            </div>
          </div>
        )}

        {lastResult && (
          <div className="banner banner--subtle">
            <span>
              Your last <strong>{lastResult.categoryName}</strong> results are
              still available.
            </span>
            <Link to="/results" className="btn btn--ghost">
              View results
            </Link>
          </div>
        )}

        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="section-title">
            Choose a category
          </h2>

          {isPending && (
            <div className="category-grid">
              <div className="card category-card skeleton" />
            </div>
          )}
          {error && (
            <p className="error">Could not load categories: {error.message}</p>
          )}
          {startError && (
            <p className="error">Could not start the test: {startError}</p>
          )}

          {categories && (
            <div className="category-grid">
              {categories.map((c) => {
                const Icon =
                  CATEGORY_ICONS[c.id] ??
                  (c.id.startsWith("pharmacology-") ? PillIcon : ClipboardIcon);
                const loading = pending === c.id;
                return (
                  <article key={c.id} className="card category-card">
                    <div className="category-card__icon">
                      <Icon size={26} />
                    </div>
                    <h3>{c.name}</h3>
                    <p className="muted">{c.description}</p>
                    <ul className="meta">
                      <li>
                        <ClipboardIcon size={16} /> {c.questionsPerTest}{" "}
                        questions
                      </li>
                      <li>
                        <ClockIcon size={16} /> {c.timeLimitMinutes} min
                      </li>
                    </ul>
                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      disabled={!!pending}
                      onClick={() => {
                        if (
                          inProgress &&
                          !window.confirm(
                            "Starting a new test will discard your test in progress. Continue?",
                          )
                        )
                          return;
                        void startTest(c.id);
                      }}
                    >
                      {loading ? "Preparing…" : "Start test"}
                      {!loading && <ChevronRightIcon size={18} />}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
