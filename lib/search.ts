import type { Contact } from './types';

const MAX_QUERY_LENGTH = 80;

/** A contact plus the lowercased fields the search reads, folded once at load. */
export type IndexedContact = Contact & {
  readonly _name: string;
  readonly _company: string;
};

/** Fold the searchable fields once, so a keystroke does no lowercasing at all. */
export function indexContacts(contacts: Contact[]): IndexedContact[] {
  return contacts.map((contact) => ({
    ...contact,
    _name: contact.name.toLowerCase(),
    _company: contact.company.toLowerCase(),
  }));
}

export function normalizeQuery(raw: string): string {
  return raw.trim().slice(0, MAX_QUERY_LENGTH).toLowerCase();
}

/**
 * Same shape as the SQL this replaces: match on name or company as a plain
 * substring, then priority rows first, then prefix matches, then alphabetical.
 * The list is 251 rows, so a linear scan per keystroke is imperceptible.
 */
export function searchContacts(index: IndexedContact[], query: string): IndexedContact[] {
  const q = normalizeQuery(query);
  if (q.length === 0) return index;

  const matches = index.filter(
    (contact) => contact._name.includes(q) || contact._company.includes(q),
  );

  return matches.sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;

    const aPrefix = a._company.startsWith(q) || a._name.startsWith(q);
    const bPrefix = b._company.startsWith(q) || b._name.startsWith(q);
    if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;

    return a.company.localeCompare(b.company) || a.name.localeCompare(b.name);
  });
}
