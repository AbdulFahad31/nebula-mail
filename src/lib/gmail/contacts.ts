export interface ContactInfo {
  name: string;
  email: string;
  raw: string;
}

export function parseContacts(headerStr?: string): ContactInfo[] {
  if (!headerStr || !headerStr.trim()) return [];

  const rawParts = headerStr
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((s) => s.trim())
    .filter(Boolean);

  return rawParts.map((part) => {
    const match = part.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
    if (match) {
      const name = (match[1] || '').trim();
      const email = match[2].trim();
      return {
        name: name || email,
        email,
        raw: part,
      };
    }

    const clean = part.replace(/^"|"$/g, '').trim();
    return {
      name: clean,
      email: clean,
      raw: part,
    };
  });
}

export function getRecipientDisplayInfo(recipientHeader?: string): {
  displayName: string;
  avatarName: string;
  count: number;
} {
  const contacts = parseContacts(recipientHeader);
  if (contacts.length === 0) {
    return {
      displayName: 'To: (No recipient)',
      avatarName: 'Recipients',
      count: 0,
    };
  }

  const first = contacts[0];
  const firstLabel = first.name || first.email;
  const count = contacts.length;

  if (count === 1) {
    return {
      displayName: `To: ${firstLabel}`,
      avatarName: firstLabel,
      count: 1,
    };
  }

  return {
    displayName: `To: ${firstLabel}, +${count - 1}`,
    avatarName: firstLabel,
    count,
  };
}
