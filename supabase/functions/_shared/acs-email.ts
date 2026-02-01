const ACS_EMAIL_ENDPOINT = Deno.env.get('ACS_EMAIL_ENDPOINT');
const ACS_EMAIL_ACCESS_KEY = Deno.env.get('ACS_EMAIL_ACCESS_KEY');

export type EmailRecipient = {
  email: string;
  displayName?: string;
};

export type SendAcsEmailArgs = {
  senderAddress: string;
  subject: string;
  plainText: string;
  html?: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
};

export async function sendAcsEmail(args: SendAcsEmailArgs) {
  const endpoint = requireEnv('ACS_EMAIL_ENDPOINT', ACS_EMAIL_ENDPOINT);
  const accessKey = requireEnv('ACS_EMAIL_ACCESS_KEY', ACS_EMAIL_ACCESS_KEY);

  const senderAddress = normalizeSender(args.senderAddress);
  if (!args.subject.trim()) {
    throw new Error('Email subject is required');
  }
  if (!args.plainText.trim()) {
    throw new Error('Email plain text content is required');
  }

  const to = normalizeRecipients(args.to, 'to');
  const cc = args.cc ? normalizeRecipients(args.cc, 'cc') : undefined;
  const bcc = args.bcc ? normalizeRecipients(args.bcc, 'bcc') : undefined;

  const url = new URL('/emails:send', endpoint);
  url.searchParams.set('api-version', '2023-03-31');

  const payload = {
    senderAddress,
    content: {
      subject: args.subject,
      plainText: args.plainText,
      html: args.html,
    },
    recipients: {
      to,
      ...(cc && cc.length ? { cc } : {}),
      ...(bcc && bcc.length ? { bcc } : {}),
    },
  };

  const body = JSON.stringify(payload);
  const contentHash = await sha256Base64(body);
  const date = new Date().toUTCString();

  const signature = await signRequest({
    accessKey,
    method: 'POST',
    pathAndQuery: `${url.pathname}${url.search}`,
    date,
    host: url.host,
    contentHash,
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ms-date': date,
      'x-ms-content-sha256': contentHash,
      Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
    },
    body,
  });

  if (!response.ok) {
    const details = await safeReadText(response);
    throw new Error(`ACS email send failed (${response.status}): ${details}`);
  }

  return response.json().catch(() => ({}));
}

function requireEnv(name: string, value?: string | null) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function normalizeSender(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Sender address must be a valid email');
  }
  if (trimmed.includes('<') || trimmed.includes('>')) {
    throw new Error('Sender address must be a plain email without display name');
  }
  return trimmed;
}

function normalizeRecipients(recipients: EmailRecipient[], label: string) {
  if (!recipients.length) {
    throw new Error(`At least one ${label} recipient is required`);
  }

  return recipients.map((recipient) => {
    const email = recipient.email.trim();
    if (!email || !email.includes('@')) {
      throw new Error(`Invalid ${label} recipient email`);
    }

    const displayName = recipient.displayName?.trim();
    return displayName ? { email, displayName } : { email };
  });
}

async function sha256Base64(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return encodeBase64(digest);
}

async function signRequest(args: {
  accessKey: string;
  method: string;
  pathAndQuery: string;
  date: string;
  host: string;
  contentHash: string;
}) {
  const keyBytes = decodeBase64(args.accessKey);
  const toSign = `${args.method}\n${args.pathAndQuery}\n${args.date};${args.host};${args.contentHash}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    new TextEncoder().encode(toSign),
  );
  return encodeBase64(signature);
}

function encodeBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function safeReadText(response: Response) {
  try {
    return (await response.text()).slice(0, 5000);
  } catch {
    return '';
  }
}
