import { sendAcsEmail } from './acs-email.ts';

type SupabaseServiceClient = any;

type EmailConfigRow = {
  email_from?: unknown;
  provider?: unknown;
};

export type DonationsEmailConfig = {
  senderAddress: string;
  provider: 'azure_communication_services';
};

export async function loadDonationsEmailConfig(supabase: SupabaseServiceClient): Promise<DonationsEmailConfig> {
  const { data, error } = await supabase.schema('donations').rpc('donations_get_email_config');
  if (error) {
    throw new Error(error.message || 'Unable to load donations email configuration');
  }

  const row = (Array.isArray(data) ? (data[0] as EmailConfigRow | undefined) : null) ?? null;

  const rawFrom = typeof row?.email_from === 'string' ? row.email_from.trim() : '';
  const provider = typeof row?.provider === 'string' ? row.provider.trim().toLowerCase() : '';

  if (!rawFrom || !rawFrom.includes('@')) {
    throw new Error('Donations email sender is not configured');
  }
  if (!provider) {
    throw new Error('Donations email provider is not configured');
  }
  if (provider !== 'azure_communication_services') {
    throw new Error(`Unsupported donations email provider: ${provider}`);
  }

  return { senderAddress: normalizeSenderAddress(rawFrom), provider: 'azure_communication_services' };
}

export async function sendDonationsEmail(
  supabase: SupabaseServiceClient,
  args: { to: string; subject: string; content: string; html?: string },
): Promise<void> {
  const config = await loadDonationsEmailConfig(supabase);

  const to = normalizeRecipientEmail(args.to);
  await sendAcsEmail({
    senderAddress: config.senderAddress,
    subject: args.subject,
    plainText: args.content,
    html: args.html,
    to: [{ email: to }],
  });
}

function normalizeSenderAddress(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.includes('@')) {
    throw new Error('From address must include @');
  }
  if (trimmed.includes('<') || trimmed.includes('>')) {
    throw new Error('From address must be a plain email without display name');
  }
  return trimmed;
}

function normalizeRecipientEmail(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Recipient email is invalid');
  }
  return trimmed;
}
