import { useEffect, useMemo, useState } from 'react';
import { findTableMatches, groupGuestsByTable } from './search.js';
import { loadSeatingCsv } from './seatingData.js';

const seatingCsvUrl =
  import.meta.env.VITE_SEATING_CSV_URL || '/June15_seating_arrangment.csv';

export default function App() {
  const [guests, setGuests] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
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
  const canSearch = firstName.trim().length > 0 || lastName.trim().length > 0;
  const hasSearched = submittedQuery.length > 0;
  const matches = useMemo(
    () =>
      hasSearched
        ? findTableMatches(submittedQuery, guests, guestsByTable)
        : [],
    [hasSearched, submittedQuery, guests, guestsByTable],
  );

  const hasPartialName = firstName.trim().length > 0 || lastName.trim().length > 0;

  function handleInputChange(setValue, value) {
    setValue(value);
    setSubmittedQuery('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (canSearch && status === 'ready') {
      setSubmittedQuery(query);
    }
  }

  return (
    <main>
      <section className="invitation-hero" aria-labelledby="wedding-title">
        <div className="hero-content">
          <p className="welcome-line">Welcome to the Wedding Reception of</p>
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
            Enter your first name, last name, or both to see your table and the
            guests seated with you.
          </p>
        </div>

        <form
          className="search-panel"
          aria-label="Guest search"
          onSubmit={handleSubmit}
        >
        {hasPartialName && (
          <div className="search-panel-actions">
            <button
              className="clear-button"
              type="button"
              onClick={() => {
                setFirstName('');
                setLastName('');
                setSubmittedQuery('');
              }}
            >
              Clear
            </button>
          </div>
        )}

        <div className="name-fields">
          <div>
            <label htmlFor="first-name">First name</label>
            <input
              id="first-name"
              autoComplete="given-name"
              inputMode="text"
              placeholder="Ex: Joy"
              type="text"
              value={firstName}
              onChange={(event) =>
                handleInputChange(setFirstName, event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="last-name">Last name</label>
            <input
              id="last-name"
              autoComplete="family-name"
              inputMode="text"
              placeholder="Ex: Barot"
              type="text"
              value={lastName}
              onChange={(event) =>
                handleInputChange(setLastName, event.target.value)
              }
            />
          </div>
        </div>

        <div className="action-buttons">
          <button type="submit" disabled={!canSearch || status !== 'ready'}>
            Enter
          </button>
        </div>

        <div className="status-line" role="status" aria-live="polite">
          {status === 'loading' && 'Loading the seating chart...'}
          {status === 'error' && error}
          {status === 'ready' &&
            canSearch &&
            !hasSearched &&
            'Click Enter to search.'}
          {status === 'ready' &&
            hasSearched &&
            matches.length > 0 &&
            `${matches.length} possible ${matches.length === 1 ? 'table' : 'tables'} found.`}
          {status === 'ready' &&
            hasSearched &&
            matches.length === 0 &&
            'No matching guest found.'}
        </div>
        </form>

        {status === 'ready' && hasSearched && matches.length === 0 && (
          <section className="empty-state" aria-label="No results">
            <h2>No table found yet</h2>
            <p>
              Check the spelling of both names, or check with the seating
              display or wedding party.
            </p>
          </section>
        )}

        {status === 'ready' && hasSearched && matches.length > 0 && (
          <section className="results" aria-label="Matching table results">
            {matches.map((match) => (
              <article
                className="table-card"
                key={`${match.table}-${match.matchedGuests[0]?.id || 'match'}`}
              >
                <div className="table-card-header">
                  <h2>{match.table ? `Table ${match.table}` : 'Table not assigned'}</h2>
                </div>

                <div className="matched-guests">
                  <h3>Matched name</h3>
                  <ul className="guest-list matched-list">
                    {match.matchedGuests.map((guest) => (
                      <li key={`${guest.guest_name}-${guest.table}`}>
                        <img aria-hidden="true" src="/user.png" alt="" />
                        <span>{guest.guest_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tablemates">
                  <h3>{match.table ? 'Sitting with' : 'Guest'}</h3>
                  <ul className="guest-list tablemate-list">
                    {match.tableGuests.map((guest) => {
                      const isMatched = match.matchedGuests.some(
                        (matchedGuest) => matchedGuest.id === guest.id,
                      );

                      return (
                        <li
                          className={isMatched ? 'is-match' : undefined}
                          key={guest.id}
                        >
                          <img aria-hidden="true" src="/user.png" alt="" />
                          <span>{guest.guest_name}</span>
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
