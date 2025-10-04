export const dynamic = 'force-dynamic';

export default function IndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-[2fr,1fr] lg:items-start">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Community Care in Action</p>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Northumberland neighbours working together on housing stability and harm reduction.
          </h2>
          <p className="text-base text-slate-700 dark:text-slate-300">
            The IHARC Command Center shares real-time insights, ideas, and commitments from partners across the
            community. Explore collaborative responses, offer peer guidance, and celebrate local strengths without
            exposing personal details.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/command-center"
              className="inline-flex items-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Enter the Command Center
            </a>
            <a
              href="/solutions"
              className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Visit the Community Solutions Board
            </a>
          </div>
        </section>
        <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">What you can do here</h3>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Track collaborative commitments across housing, shelter, and outreach.</li>
            <li>Share strengths-based ideas and receive respectful feedback from peers.</li>
            <li>Coordinate with agencies without revealing identifying information.</li>
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Questions about participation? Email <a className="underline" href="mailto:portal@iharc.ca">portal@iharc.ca</a> to connect with the facilitation team.
          </p>
        </aside>
      </div>
    </div>
  );
}
