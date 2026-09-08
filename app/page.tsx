import SearchView from './search-view';

export default function Page() {
  return (
    <main className="shell">
      <header className="masthead">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="masthead__logo"
          src="/logo-horizontal.png"
          alt="Talent Muscle, an EmergeFlow company"
          width={200}
          height={56}
        />
        <p className="eyebrow">HR tech summit</p>
        <h1 className="masthead__title">Find anyone in the room</h1>
        <p className="masthead__lede">
          251 HR leaders. Search by a person&rsquo;s name or their company.
        </p>
      </header>
      <SearchView />
    </main>
  );
}
