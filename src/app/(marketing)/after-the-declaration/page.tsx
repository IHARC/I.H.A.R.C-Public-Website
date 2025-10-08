import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'After the Declaration: how Cobourg mobilizes — IHARC',
  description:
    'See how Cobourg activates the Incident Management System after declaring a municipal emergency, with IHARC tools supporting coordinated housing and overdose response.',
};

export default function AfterTheDeclarationPage() {
  return (
    <div className="space-y-16 bg-surface pb-16 text-on-surface">
      <header className="bg-surface-container py-12">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 text-balance">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Emergency coordination</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">After the Declaration: how Cobourg mobilizes</h1>
          <p className="max-w-3xl text-lg text-on-surface/80">
            A State of Emergency is the moment we stop reacting and start managing. It triggers the Town’s{' '}
            <strong>Incident Management System (IMS)</strong>—the same framework used across Ontario for fires, floods, and
            other large-scale crises—so every department and partner operates under one plan with defined objectives and clear
            communication lines.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-14 px-4 text-balance">
        <Section
          title="Step 1: Stand up the Incident Management System"
          description={[
            'Assign roles and leads: Operations, Planning, Logistics, Finance/Admin, and Public Information',
            'Establish coordination routines: daily briefings, weekly public summaries',
            'Publish initial objectives: immediate stabilization, safety, outreach coverage, and data collection',
          ]}
        >
          <p className="text-base text-on-surface/80">
            This structure provides the foundation for disciplined, transparent decision-making. Existing community initiatives—like
            IHARC’s data systems, outreach teams, and public collaboration platform—directly support these efforts, ensuring the
            response starts with on-the-ground insight rather than bureaucracy.
          </p>
        </Section>

        <Section
          title="Step 2: Build the Emergency Response Plan"
          description={[
            'Objectives: short-term actions for safety, housing stability, and outreach coordination',
            'Timelines: week-by-week targets with public updates',
            'Data sources: shelter capacity, overdose incidents, outreach contact logs',
            'Public transparency: updates published on a single dashboard',
          ]}
        >
          <p className="text-base text-on-surface/80">
            It’s not another report—it’s the operating manual for the emergency response.
          </p>
        </Section>

        <Section
          title="Step 3: Integrate community input"
          description={[
            'Review collaboration portal ideas through the Planning section of the IMS',
            'Prioritize rapid pilots grounded in local evidence',
            'Scale successful initiatives—coordinated transport, safe-camp frameworks, real-time outreach data—within the emergency response',
          ]}
        >
          <p className="text-base text-on-surface/80">
            The <strong>IHARC Collaboration Portal</strong> already hosts local solutions. Incorporating them keeps the emergency
            response rooted in what neighbours, front-line workers, and agencies know works.
          </p>
        </Section>

        <Section
          title="Step 4: Communicate and track progress"
          description={[
            'Weekly updates: public progress summaries and next steps',
            'Response dashboard: live metrics with update timestamps',
            'Issue log: visible list of challenges and assigned leads',
            'Feedback form: community submissions acknowledged within five business days',
          ]}
        >
          <p className="text-base text-on-surface/80">
            Transparency isn’t optional—it’s how the public knows this is working.
          </p>
        </Section>

        <Section
          title="Step 5: Review, adjust, and transition"
          description={[
            'Evaluate every 30 days whether the emergency status should continue',
            'Identify pilots ready for scale and long-term investment',
            'Transition successful approaches into municipal or county service delivery',
          ]}
        >
          <p className="text-base text-on-surface/80">
            Regular review keeps the system responsive and prevents stagnation.
          </p>
        </Section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">What success looks like</h2>
          <ul className="space-y-3 text-base text-on-surface/80">
            <li>Faster coordination and fewer gaps between agencies</li>
            <li>Improved placement rates and outreach coverage</li>
            <li>Measurable reduction in unmanaged crises and public health risks</li>
            <li>Residents seeing progress through data and communication, not spin</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-3xl border border-outline/15 bg-surface-container px-6 py-5 text-base text-on-surface/80">
          <p className="text-lg font-semibold text-on-surface">Closing section</p>
          <p>
            A declaration isn’t about expanding power—it’s about restoring order. By standing up a unified emergency response,
            Cobourg can replace reactive chaos with coordinated action, measurable results, and community trust.
          </p>
          <p className="font-semibold text-on-surface">
            This is where leadership meets accountability—and where real recovery begins.
          </p>
        </section>
      </main>
    </div>
  );
}

type SectionProps = {
  title: string;
  description: string[];
  children?: ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="space-y-3 text-base text-on-surface/80">
        {description.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {children}
    </section>
  );
}
