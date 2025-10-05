export const dynamic = 'force-dynamic';

const sections = [
  {
    title: 'Community Status Dashboard',
    description:
      'Track real-time metrics on homelessness, shelter capacity, drug poisoning response, and health outreach supports reported by local partners.',
    href: '/stats',
    action: 'Open the stats dashboard',
    tone: 'bg-white text-slate-900',
  },
  {
    title: 'Collaboration Workspace',
    description:
      'Share ideas, up-vote promising pilots, and coordinate with agencies and Town staff using language that keeps dignity and humane responses at the center.',
    href: '/command-center',
    action: 'Enter the collaboration hub',
    tone: 'bg-slate-900 text-slate-50',
  },
];

const commitments = [
  'Plain, strengths-based language. No deficit framing.',
  'Anonymous participation options that still protect neighbours.',
  'Open audit trail of decisions, commitments, and hand-offs.',
  'Rapid iteration inspired by sprints, explained in approachable terms.',
  'Ideas must advance humane, evidence-informed supports over punitive quick fixes.',
];

export default function IndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <section className="grid gap-10 lg:grid-cols-[1.3fr,0.7fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            IHARC public portal MVP
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Community intelligence for housing stability and compassionate public health.
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            Northumberland neighbours, agencies, and the Town co-manage this space to surface urgent needs, highlight strengths, and act on solutions that prevent homelessness and drug poisoning harms. Data is refreshed continuously and every participant can see how ideas move forward.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/stats"
              className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              See live metrics
            </a>
            <a
              href="/command-center"
              className="inline-flex items-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Visit the collaboration hub
            </a>
            <a
              href="/register"
              className="inline-flex items-center rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Register to contribute
            </a>
          </div>
        </div>
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">What is IHARC?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The Integrated Homelessness & Addictions Response Centre convenes neighbours, frontline teams, and government to coordinate compassionate, evidence-informed solutions. This portal keeps the work transparent and people-first.
          </p>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <span className="font-semibold text-slate-900 dark:text-slate-50">Two goals:</span> real-time public stats and a community solutions workspace.
            </li>
            <li>Moderators and administrators guide respectful, humane collaboration.</li>
            <li>No identifying information about neighbours is stored or displayed.</li>
            <li>Contact <a className="text-brand underline" href="mailto:portal@iharc.ca">portal@iharc.ca</a> for onboarding support.</li>
          </ul>
        </aside>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <a
            key={section.title}
            href={section.href}
            className={`group relative overflow-hidden rounded-3xl border border-slate-200 p-8 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800 ${section.tone}`}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand/80">{section.title}</p>
                <p className="text-lg leading-relaxed">{section.description}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                {section.action}
                <span aria-hidden className="transition group-hover:translate-x-1">{'->'}</span>
              </span>
            </div>
          </a>
        ))}
      </section>

      <section className="mt-16 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-inner dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Shared commitments</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Every contribution honours dignity and community care. Moderation policies and audit trails are in place to keep this portal trustworthy.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {commitments.map((item) => (
            <li key={item} className="rounded-xl bg-white p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
