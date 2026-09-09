'use client';

import { useState } from 'react';
import type { Contact } from '@/lib/types';

const MAX_REMARKS_LENGTH = 2000;

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

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  contact: Contact;
  remarks: string | null;
  onSaved: (contactId: number, remarks: string | null) => void;
  animationDelay?: string;
};

export default function ContactCard({ contact, remarks, onSaved, animationDelay }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(remarks ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  function open() {
    setDraft(remarks ?? '');
    setSaveState('idle');
    setIsEditing(true);
  }

  async function save() {
    setSaveState('saving');
    try {
      const response = await fetch(`/api/contacts/${contact.id}/remarks`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ remarks: draft }),
      });
      if (!response.ok) throw new Error('save failed');
      const data = (await response.json()) as { remarks: string | null };
      onSaved(contact.id, data.remarks);
      setSaveState('saved');
      setIsEditing(false);
    } catch {
      setSaveState('error');
    }
  }

  return (
    <li className="card" style={animationDelay ? { animationDelay } : undefined}>
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

      <div className="remarks">
        {isEditing ? (
          <>
            <label className="remarks__label" htmlFor={`remarks-${contact.id}`}>
              Discussion remarks
            </label>
            <textarea
              id={`remarks-${contact.id}`}
              className="remarks__box"
              rows={3}
              maxLength={MAX_REMARKS_LENGTH}
              placeholder="What did you discuss?"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoFocus
            />
            <div className="remarks__actions">
              <button
                type="button"
                className="remarks__save"
                onClick={() => void save()}
                disabled={saveState === 'saving'}
              >
                {saveState === 'saving' ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="remarks__cancel"
                onClick={() => setIsEditing(false)}
                disabled={saveState === 'saving'}
              >
                Cancel
              </button>
              <span className="remarks__status" role="status" aria-live="polite">
                {saveState === 'error' ? 'Could not save. Try again.' : ''}
              </span>
            </div>
          </>
        ) : remarks ? (
          <>
            <p className="remarks__text">
              <span className="remarks__icon" aria-hidden="true"><NoteIcon /></span>
              <span><span className="remarks__title">Remarks</span> {remarks}</span>
            </p>
            <button type="button" className="remarks__edit" onClick={open}>
              Edit remarks
            </button>
          </>
        ) : (
          <button type="button" className="remarks__edit" onClick={open}>
            <span className="remarks__icon" aria-hidden="true"><NoteIcon /></span>
            Add discussion remarks
          </button>
        )}
      </div>
    </li>
  );
}
