import type { Metadata } from 'next';
import PinForm from './pin-form';

export const metadata: Metadata = {
  title: 'Enter PIN — HR Tech summit contacts',
};

export default function PinPage() {
  return (
    <main className="shell pin">
      <div className="pin__panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pin__logo"
          src="/logo-horizontal.png"
          alt="Talent Muscle, an EmergeFlow company"
          width={200}
          height={56}
        />
        <p className="eyebrow">HR tech summit</p>
        <h1 className="pin__title">This list is PIN protected</h1>
        <p className="pin__lede">
          The contact list holds named individuals and their employers. Enter the PIN shared with
          your team to open it.
        </p>
        <PinForm />
      </div>
    </main>
  );
}
