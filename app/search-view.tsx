'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ContactCard from './contact-card';
import { indexContacts, searchContacts, type IndexedContact } from '@/lib/search';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type Status = 'loading' | 'ready' | 'error';

type Failure = 'not_configured' | 'not_seeded' | 'search_failed' | 'offline';

const FAILURE_COPY: Record<Failure, { title: string; detail: string }> = {
  not_configured: {
    title: 'The contact list is not connected yet.',
    detail: 'Add the Neon integration on the Vercel project, then run the seed once.',
  },
  not_seeded: {
    title: 'The database is connected but empty.',
    detail: 'Run npm run seed to load the 251 contacts.',
  },
  search_failed: {
    title: 'The contact list would not load.',
    detail: 'Try again in a moment.',
  },
  offline: {
    title: 'Could not reach the contact list.',
    detail: 'Check the connection and load it again.',
  },
};

class LoadFailed extends Error {
  constructor(readonly reason: Failure) {
    super(reason);
  }
}

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexedContact[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [failure, setFailure] = useState<Failure>('search_failed');
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Remarks are kept beside the search index, so saving one note does not
  // rebuild the folded fields the search reads.
  const [remarks, setRemarks] = useState<Record<number, string | null>>({});

  // The whole list arrives in one request. Every search after that runs against
  // this array, so typing costs no network and works with the connection gone.
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    fetch('/api/contacts', { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const reason = (data as { error?: Failure }).error;
          throw new LoadFailed(reason && reason in FAILURE_COPY ? reason : 'search_failed');
        }
        return data as { contacts: Parameters<typeof indexContacts>[0] };
      })
      .then((data) => {
        setIndex(indexContacts(data.contacts));
        setRemarks(
          Object.fromEntries(data.contacts.map((contact) => [contact.id, contact.remarks])),
        );
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFailure(error instanceof LoadFailed ? error.reason : 'offline');
        setIndex([]);
        setStatus('error');
      });

    return () => controller.abort();
  }, [attempt]);

  // With no query this is the whole list. That is a browse, not a result, so it
  // stays folded away until someone asks for it.
  const isBrowsing = query.trim() === '';

  useEffect(() => {
    if (isBrowsing) setIsBrowseOpen(false);
  }, [isBrowsing]);

  const results = useMemo(() => searchContacts(index, query), [index, query]);

  const onRemarksSaved = useCallback((contactId: number, saved: string | null) => {
    setRemarks((current) => ({ ...current, [contactId]: saved }));
  }, []);

  const peopleCount = `${results.length} ${results.length === 1 ? 'person' : 'people'}`;

  function renderResults() {
    return (
      <ul className="results">
        {results.map((contact, position) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            remarks={remarks[contact.id] ?? null}
            onSaved={onRemarksSaved}
            animationDelay={position < 4 ? `${position * 60}ms` : undefined}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="searchbar">
        <div className="field">
          <span className="field__icon" aria-hidden="true"><SearchIcon /></span>
          <input
            className="field__input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Name or company"
            aria-label="Search by name or company"
            disabled={status !== 'ready'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query !== '' && (
            <button
              type="button"
              className="field__clear"
              aria-label="Clear the search"
              onClick={() => setQuery('')}
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {status === 'loading' && <p className="count">Loading the list…</p>}

      {status === 'error' && (
        <div className="notice">
          <p className="notice__title">{FAILURE_COPY[failure].title}</p>
          <p className="notice__detail">{FAILURE_COPY[failure].detail}</p>
          <button type="button" className="notice__retry" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && !isBrowsing && (
        <p className="count" aria-live="polite">{peopleCount}</p>
      )}

      {status === 'ready' && !isBrowsing && results.length === 0 && (
        <p className="notice">No one matches that. Try a company name.</p>
      )}

      {status === 'ready' && isBrowsing ? (
        <section className={`browse${isBrowseOpen ? ' browse--open' : ''}`}>
          <h2 className="browse__heading">
            <button
              type="button"
              className="browse__toggle"
              aria-expanded={isBrowseOpen}
              aria-controls="browse-panel"
              onClick={() => setIsBrowseOpen((open) => !open)}
            >
              <span
                className={`browse__chevron${isBrowseOpen ? ' browse__chevron--open' : ''}`}
                aria-hidden="true"
              >
                <ChevronIcon />
              </span>
              <span className="browse__label">Browse without searching</span>
              <span className="browse__count">{peopleCount}</span>
            </button>
          </h2>
          {/* The names live inside the section, so opening it never spills them
              out into the page below. */}
          <div className="browse__panel" id="browse-panel" hidden={!isBrowseOpen}>
            {isBrowseOpen && renderResults()}
          </div>
        </section>
      ) : (
        status === 'ready' && renderResults()
      )}
    </>
  );
}
