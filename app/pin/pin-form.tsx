'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PIN_LENGTH } from '@/lib/pin';

type Status = 'idle' | 'checking' | 'wrong' | 'error';

const MESSAGE: Partial<Record<Status, string>> = {
  wrong: 'That PIN is not right. Try again.',
  error: 'Could not check the PIN. Try again in a moment.',
};

export default function PinForm() {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(value: string) {
    setStatus('checking');
    try {
      const response = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      if (response.ok) {
        router.replace('/');
        return;
      }
      setStatus(response.status === 401 ? 'wrong' : 'error');
    } catch {
      setStatus('error');
    }
    setPin('');
    inputRef.current?.focus();
  }

  function onChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    if (status === 'wrong' || status === 'error') setStatus('idle');
    if (digits.length === PIN_LENGTH) void submit(digits);
  }

  const isBusy = status === 'checking';
  const message = MESSAGE[status];

  return (
    <form
      className="pin__form"
      onSubmit={(event) => {
        event.preventDefault();
        if (pin.length === PIN_LENGTH && !isBusy) void submit(pin);
      }}
    >
      <label className="pin__label" htmlFor="pin-input">
        Enter the {PIN_LENGTH}-digit PIN
      </label>

      <div className={`pin__cells${status === 'wrong' ? ' pin__cells--wrong' : ''}`}>
        <input
          id="pin-input"
          ref={inputRef}
          className="pin__input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={PIN_LENGTH}
          value={pin}
          disabled={isBusy}
          aria-describedby="pin-message"
          onChange={(event) => onChange(event.target.value)}
        />
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`pin__cell${
              index < pin.length
                ? ' pin__cell--filled'
                : index === pin.length && !isBusy
                  ? ' pin__cell--active'
                  : ''
            }`}
          >
            {index < pin.length ? '•' : ''}
          </span>
        ))}
      </div>

      <p className="pin__message" id="pin-message" role="status" aria-live="polite">
        {isBusy ? 'Checking…' : (message ?? ' ')}
      </p>

      <button className="pin__submit" type="submit" disabled={pin.length !== PIN_LENGTH || isBusy}>
        {isBusy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  );
}
