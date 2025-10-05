export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface QuickAccessItem {
  title: string;
  description: string;
  href: string;
  icon: string;
  urgent?: boolean;
}

export interface ProgramItem {
  title: string;
  description: string;
  icon: string;
  href?: string;
}

export interface CounterItem {
  value: number | null;
  label: string;
  suffix?: string;
}

export interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'white';
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: NavItem[];
}

export interface ContentFlags {
  devNotice: boolean;
  noindex: boolean;
  showImpact: boolean;
  showNews: boolean;
}

export const nav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Programs & Services', href: '/programs' },
  { label: 'Get Help', href: '/get-help' },
  { label: 'Collaboration Portal', href: '/command-center' },
  { label: 'News', href: '/news' },
  { label: 'Get Involved', href: '/involved' },
  { label: 'Contact', href: '/contact' },
];

export const headerCTAs: CTAButton[] = [
  { text: 'Get Help Now', href: '/get-help', variant: 'primary' },
  { text: 'Donate', href: '/donate', variant: 'secondary' },
];

export const quickAccess: QuickAccessItem[] = [
  {
    title: 'Need Help Tonight?',
    description: '24/7 crisis support and emergency shelter',
    href: '/crisis-support',
    icon: 'phone',
    urgent: true,
  },
  {
    title: 'Report a Concern',
    description: 'Community safety and welfare reporting',
    href: '/report',
    icon: 'alert-triangle',
  },
  {
    title: 'Bike Safe',
    description: 'Bicycle registration and safety program',
    href: '/bike-safe',
    icon: 'bike',
  },
  {
    title: 'Red Team Collaboration',
    description: 'Security assessments for local businesses',
    href: '/red-team',
    icon: 'shield',
  },
];

export const programs: ProgramItem[] = [
  {
    title: 'Outreach',
    description: 'Street outreach and mobile support services connecting people to resources and housing.',
    icon: 'users',
    href: '/programs/outreach',
  },
  {
    title: 'Health Support Services',
    description: 'Health and safety supplies, safe disposal of used health supplies, and drug poisoning response kits reducing health risks.',
    icon: 'heart',
    href: '/programs/health-support',
  },
  {
    title: 'Crisis Response',
    description: 'Immediate intervention and support during mental health and addiction emergencies.',
    icon: 'zap',
    href: '/programs/crisis-response',
  },
  {
    title: 'Community Safety',
    description: 'Collaborative approaches to improve safety and reduce crime in public spaces.',
    icon: 'shield-check',
    href: '/programs/community-safety',
  },
  {
    title: 'Special Collaborations',
    description: 'Innovative pilots and research initiatives addressing emerging community needs.',
    icon: 'lightbulb',
    href: '/programs/special-collaborations',
  },
  {
    title: 'Resources & Info',
    description: 'Comprehensive directory of local services, supports, and emergency contacts.',
    icon: 'book-open',
    href: '/resources',
  },
];

export const impactCounters: CounterItem[] = [
  { value: null, label: 'People Connected to Services', suffix: 'updating...' },
  { value: null, label: 'Emergency Interventions', suffix: 'updating...' },
  { value: null, label: 'Successful Housing Placements', suffix: 'updating...' },
  { value: null, label: 'Community Partners', suffix: 'updating...' },
];

export const cta = {
  title: 'Partner with us to improve safety and health across Northumberland.',
  buttons: [
    { text: 'Donate Now', href: '/donate', variant: 'white' as const },
    { text: 'Volunteer', href: '/volunteer', variant: 'secondary' as const },
  ],
};

export const footer: {
  sections: FooterSection[];
  contact: {
    address: string[];
    phone: string;
    email: string;
  };
  social: NavItem[];
  legal: NavItem[];
} = {
  sections: [
    {
      title: 'Quick Access',
      links: [
        { label: 'Get Help Now', href: '/get-help' },
        { label: 'Report Concern', href: '/report' },
        { label: 'Programs & Services', href: '/programs' },
        { label: 'About IHARC', href: '/about' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Service Directory', href: '/resources' },
        { label: 'Collaboration Portal', href: '/command-center' },
        { label: 'News & Updates', href: '/news' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
    {
      title: 'Get Involved',
      links: [
        { label: 'Volunteer', href: '/volunteer' },
        { label: 'Donate', href: '/donate' },
        { label: 'Partnerships', href: '/partnerships' },
        { label: 'Careers', href: '/careers' },
      ],
    },
  ],
  contact: {
    address: [
      'IHARC',
      '123 Main Street', // TODO: Add real IHARC address
      'Cobourg, ON K9A 2N4', // TODO: Add real postal code
    ],
    phone: '(905) 555-HELP', // TODO: Add real IHARC phone number
    email: 'info@iharc.ca', // TODO: Add real IHARC email
  },
  social: [
    { label: 'Facebook', href: 'https://facebook.com/iharc', external: true },
    { label: 'Twitter', href: 'https://twitter.com/iharc', external: true },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/iharc', external: true },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Accessibility', href: '/accessibility' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export const contentFlags: ContentFlags = {
  devNotice: true, // Show under development modal
  noindex: true, // Prevent search engine indexing during development
  showImpact: false, // Set to true when ready to show impact metrics
  showNews: false, // Set to true when news content is ready
};
