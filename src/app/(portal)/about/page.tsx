export const dynamic = 'force-dynamic';

const commitments = [
  'Collaborative, strengths-based language that honours neighbours.',
  'Evidence-backed conversations anchored in shared data.',
  'Transparent audit trails for promotions, updates, and decisions.',
  'Support for anonymous participation with moderator guidance.',
  'Moderation steers proposals away from punitive or stigmatizing responses.',
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">About this portal</h1>
        <p className="text-base text-slate-700 dark:text-slate-300">
          The IHARC Command Center portal is a shared workspace for neighbours, agencies, and local government to address homelessness and the toxic drug crisis together. Every page is written in plain language so anyone can follow along, offer feedback, and hold partners accountable.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We surface ideas that expand housing, health, and social supports. Suggestions that criminalize or displace neighbours are documented for transparency but do not move forward.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">How it works</h2>
        <ol className="list-inside list-decimal space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <li>Ideas land in the proposal queue with a clear problem, evidence, and potential change.</li>
          <li>When an idea meets the bar for completeness and community support, moderators promote it to a Working Plan.</li>
          <li>Plan updates, decision notes, and key dates keep everyone aligned on what’s adopted, paused, or needs more input.</li>
        </ol>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Shared commitments</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {commitments.map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
