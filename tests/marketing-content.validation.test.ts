import { describe, expect, it } from 'vitest';
import { assertUrgentSupportContacts, type SupportEntry } from '@/data/marketing-content';

describe('marketing content guardrails', () => {
  it('accepts only approved urgent support contacts', () => {
    const urgent: SupportEntry[] = [
      {
        title: 'Crisis lines',
        summary: 'Immediate help',
        body: 'Call or email for support.',
        contacts: [
          { label: '2-1-1', href: 'tel:211' },
          { label: 'Transition House coordinated entry', href: 'tel:905-376-9562' },
          { label: '9-8-8', href: 'tel:988' },
          { label: 'NHH Community Mental Health Services', href: 'tel:905-377-9891' },
          { label: 'outreach@iharc.ca', href: 'mailto:outreach@iharc.ca' },
        ],
      },
    ];

    expect(() => assertUrgentSupportContacts(urgent)).not.toThrow();
  });

  it('rejects unapproved urgent support contacts', () => {
    const urgent: SupportEntry[] = [
      {
        title: 'Crisis lines',
        summary: 'Immediate help',
        body: 'Call or email for support.',
        contacts: [
          { label: 'Example hotline', href: 'tel:1234567890' },
          { label: 'Support desk', href: 'mailto:help@example.com' },
        ],
      },
    ];

    expect(() => assertUrgentSupportContacts(urgent)).toThrow(/Unapproved urgent support contacts/);
  });
});
