import { useEffect, useMemo, useState } from 'react';
import { findTableMatches, groupGuestsByTable } from './search.js';
import { loadSeatingCsv } from './seatingData.js';

const seatingCsvUrl =
  import.meta.env.VITE_SEATING_CSV_URL || '/File_Guest_Name_Sample.csv';

export default function App() {
  const [guests, setGuests] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadGuests() {
      setStatus('loading');
      setError('');

      try {
        const data = await loadSeatingCsv(seatingCsvUrl);

        if (isMounted) {
          setGuests(data);
          setStatus('ready');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load the seating chart.');
          setStatus('error');
        }
      }
    }

    loadGuests();

    return () => {
      isMounted = false;
    };
  }, []);

  const guestsByTable = useMemo(() => groupGuestsByTable(guests), [guests]);
  const query = `${firstName} ${lastName}`.trim();
  const canSearch = firstName.trim().length > 0 && lastName.trim().length > 0;
  const matches = useMemo(
    () => (canSearch ? findTableMatches(query, guests, guestsByTable) : []),
    [canSearch, query, guests, guestsByTable],
  );

  const hasPartialName = firstName.trim().length > 0 || lastName.trim().length > 0;

  return (
    <main>
      <section className="invitation-hero" aria-labelledby="wedding-title">
        <div className="hero-content">
          <p className="welcome-line">Welcome to the reception of</p>
          <h1 id="wedding-title">Dwij &amp; Shefali</h1>
          <a className="hero-button" href="#table-finder">
            Find Your Table
          </a>
        </div>
      </section>

      <section
        className="finder-section"
        id="table-finder"
        aria-labelledby="finder-title"
      >
        <div className="section-heading">
          <h2 id="finder-title">Find your table</h2>
          <p className="intro">
            Enter your first and last name to see your table and the guests
            seated with you.
          </p>
        </div>

        <section className="search-panel" aria-label="Guest search">
        <div className="name-fields">
          <div>
            <label htmlFor="first-name">First name</label>
            <input
              id="first-name"
              autoComplete="given-name"
              inputMode="text"
              placeholder="Example: Joy"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="last-name">Last name</label>
            <input
              id="last-name"
              autoComplete="family-name"
              inputMode="text"
              placeholder="Example: Barot"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
        </div>

        {hasPartialName && (
          <button
            className="clear-button"
            type="button"
            onClick={() => {
              setFirstName('');
              setLastName('');
            }}
          >
            Clear
          </button>
        )}

        <div className="status-line" role="status" aria-live="polite">
          {status === 'loading' && 'Loading the seating chart...'}
          {status === 'error' && error}
          {status === 'ready' &&
            !hasPartialName &&
            `${guests.length} guests loaded. Enter your first and last name to search.`}
          {status === 'ready' &&
            hasPartialName &&
            !canSearch &&
            'Please enter both first and last name to search.'}
          {status === 'ready' &&
            canSearch &&
            matches.length > 0 &&
            `${matches.length} possible ${matches.length === 1 ? 'table' : 'tables'} found.`}
          {status === 'ready' &&
            canSearch &&
            matches.length === 0 &&
            'No matching guest found.'}
        </div>
        </section>

        {status === 'ready' && canSearch && matches.length === 0 && (
          <section className="empty-state" aria-label="No results">
            <h2>No table found yet</h2>
            <p>
              Check the spelling of both names, or check with the seating
              display or wedding party.
            </p>
          </section>
        )}

        {status === 'ready' && matches.length > 0 && (
          <section className="results" aria-label="Matching table results">
            {matches.map((match) => (
              <article className="table-card" key={match.table}>
                <div className="table-card-header">
                  <h2>{match.table ? `Table ${match.table}` : 'Table not assigned'}</h2>
                </div>

                <div className="matched-guests">
                  <h3>Matched name</h3>
                  <ul>
                    {match.matchedGuests.map((guest) => (
                      <li key={`${guest.guest_name}-${guest.table}`}>
                        {guest.guest_name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tablemates">
                  <h3>{match.table ? 'Sitting with' : 'Guest'}</h3>
                  <ul>
                    {match.tableGuests.map((guest) => {
                      const isMatched = match.matchedGuests.some(
                        (matchedGuest) => matchedGuest.id === guest.id,
                      );

                      return (
                        <li
                          className={isMatched ? 'is-match' : undefined}
                          key={guest.id}
                        >
                          {guest.guest_name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
