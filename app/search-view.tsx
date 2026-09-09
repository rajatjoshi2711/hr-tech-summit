'use client';

import { useEffect, useRef, useState } from 'react';
import type { Contact } from '@/lib/types';

const DEBOUNCE_MS = 250;

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

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
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

type Status = 'idle' | 'loading' | 'error';

type Failure = 'not_configured' | 'not_seeded' | 'search_failed';

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
    title: 'Search is down right now.',
    detail: 'Try again in a moment.',
  },
};

class SearchFailed extends Error {
  constructor(readonly reason: Failure) {
    super(reason);
  }
}

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [failure, setFailure] = useState<Failure>('search_failed');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // With no query the API returns a default slice of the list. That is a browse,
  // not a result, so it stays folded away until someone asks for it.
  const isBrowsing = query.trim() === '';

  useEffect(() => {
    if (isBrowsing) setIsBrowseOpen(false);
  }, [isBrowsing]);

  useEffect(() => {
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');

      fetch(`/api/contacts?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            const reason = (data as { error?: Failure }).error;
            throw new SearchFailed(reason && reason in FAILURE_COPY ? reason : 'search_failed');
          }
          return data as { contacts: Contact[] };
        })
        .then((data) => {
          setContacts(data.contacts);
          setStatus('idle');
          setHasLoadedOnce(true);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setFailure(error instanceof SearchFailed ? error.reason : 'search_failed');
          setContacts([]);
          setStatus('error');
          setHasLoadedOnce(true);
        });
    }, query === '' ? 0 : DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const isBusy = status === 'loading';
  const peopleCount = `${contacts.length}${contacts.length === 50 ? '+' : ''} ${
    contacts.length === 1 ? 'person' : 'people'
  }`;

  function renderResults() {
    return (
      <ul className={`results${isBusy ? ' results--busy' : ''}`}>
        {contacts.map((contact, index) => (
          <li
            key={contact.id}
            className="card"
            style={index < 4 ? { animationDelay: `${index * 60}ms` } : undefined}
          >
            <div className="card__head">
              <h3 className="card__name">{contact.name}</h3>
              {contact.is_priority && <span className="badge">Priority</span>}
            </div>
            <p className="card__company">{contact.company}</p>
            <p className="card__role">{contact.designation}</p>
            <div className="card__foot">
              {contact.industry && <span className="tag">{contact.industry}</span>}
            </div>
            {contact.requirement && (
              <p className="card__req">
                <span className="card__req-icon" aria-hidden="true"><TargetIcon /></span>
                <span><span className="card__req-label">Open for</span> {contact.requirement}</span>
              </p>
            )}
          </li>
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

      {!isBrowsing && (
        <p className="count" aria-live="polite">
          {status === 'error' ? '\u00a0' : peopleCount}
        </p>
      )}

      {status === 'error' && (
        <div className="notice">
          <p className="notice__title">{FAILURE_COPY[failure].title}</p>
          <p className="notice__detail">{FAILURE_COPY[failure].detail}</p>
        </div>
      )}

      {status !== 'error' && hasLoadedOnce && contacts.length === 0 && !isBrowsing && (
        <p className="notice">No one matches that. Try a company name.</p>
      )}

      {isBrowsing && status !== 'error' ? (
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
            {renderResults()}
          </div>
        </section>
      ) : (
        renderResults()
      )}
    </>
  );
}
