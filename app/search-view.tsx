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

type Status = 'idle' | 'loading' | 'error';

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');

      fetch(`/api/contacts?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error('request failed');
          return response.json();
        })
        .then((data: { contacts: Contact[] }) => {
          setContacts(data.contacts);
          setStatus('idle');
          setHasLoadedOnce(true);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setStatus('error');
          setHasLoadedOnce(true);
        });
    }, query === '' ? 0 : DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const isBusy = status === 'loading';

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

      <p className="count" aria-live="polite">
        {status === 'error'
          ? '\u00a0'
          : `${contacts.length}${contacts.length === 50 ? '+' : ''} ${contacts.length === 1 ? 'person' : 'people'}`}
      </p>

      {status === 'error' && (
        <p className="notice">Search is down right now. Try again in a moment.</p>
      )}

      {status !== 'error' && hasLoadedOnce && contacts.length === 0 && (
        <p className="notice">No one matches that. Try a company name.</p>
      )}

      <ul className={`results${isBusy ? ' results--busy' : ''}`}>
        {contacts.map((contact, index) => (
          <li
            key={contact.id}
            className="card"
            style={index < 4 ? { animationDelay: `${index * 60}ms` } : undefined}
          >
            <div className="card__head">
              <h2 className="card__name">{contact.name}</h2>
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
    </>
  );
}
