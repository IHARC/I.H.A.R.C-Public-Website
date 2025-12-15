type SupabaseServiceClient = any;

type EmailConfigRow = {
  email_from?: unknown;
  provider?: unknown;
  sendgrid_api_key?: unknown;
};

export type DonationsEmailConfig = {
  from: { email: string; name?: string };
  provider: 'sendgrid';
  sendgridApiKey: string;
};

export async function loadDonationsEmailConfig(supabase: SupabaseServiceClient): Promise<DonationsEmailConfig> {
  const { data, error } = await supabase.schema('donations').rpc('donations_get_email_config');
  if (error) {
    throw new Error(error.message || 'Unable to load donations email configuration');
  }

  const row = (Array.isArray(data) ? (data[0] as EmailConfigRow | undefined) : null) ?? null;

  const rawFrom = typeof row?.email_from === 'string' ? row.email_from.trim() : '';
  const provider = (typeof row?.provider === 'string' ? row.provider.trim().toLowerCase() : 'sendgrid') as string;
  const sendgridApiKey = typeof row?.sendgrid_api_key === 'string' ? row.sendgrid_api_key.trim() : '';

  if (!rawFrom || !rawFrom.includes('@')) {
    throw new Error('Donations email sender is not configured');
  }
  if (provider !== 'sendgrid') {
    throw new Error(`Unsupported donations email provider: ${provider}`);
  }
  if (!sendgridApiKey) {
    throw new Error('SendGrid API key is not configured');
  }

  return { from: parseFromAddress(rawFrom), provider: 'sendgrid', sendgridApiKey };
}

export async function sendDonationsEmail(
  supabase: SupabaseServiceClient,
  args: { to: string; subject: string; content: string; html?: string },
): Promise<void> {
  const config = await loadDonationsEmailConfig(supabase);

  const to = args.to.trim();
  if (!to || !to.includes('@')) {
    throw new Error('Recipient email is invalid');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: config.from,
      subject: args.subject,
      content: [
        { type: 'text/plain', value: args.content },
        ...(args.html ? [{ type: 'text/html', value: args.html }] : []),
      ],
    }),
  });

  if (response.status === 202) {
    return;
  }

  const details = await safeReadText(response);
  throw new Error(`SendGrid send failed (${response.status}): ${details}`);
}

function parseFromAddress(input: string): { email: string; name?: string } {
  const match = input.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1]?.trim().replace(/^"|"$/g, '');
    const email = match[2]?.trim();
    if (email && email.includes('@')) {
      return name ? { email, name } : { email };
    }
  }

  const email = input.trim();
  if (!email.includes('@')) {
    throw new Error('From address must include @');
  }
  return { email };
}

async function safeReadText(response: Response) {
  try {
    return (await response.text()).slice(0, 5000);
  } catch {
    return '';
  }
}
