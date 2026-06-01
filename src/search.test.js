import { describe, expect, it } from 'vitest';
import { findTableMatches, groupGuestsByTable, scoreGuestName } from './search.js';

const guests = [
  { id: '1', guest_name: 'Parth Patel', table: '4' },
  { id: '2', guest_name: 'Parth Patel', table: '11' },
  { id: '3', guest_name: 'Aarav Shah', table: '4' },
  { id: '4', guest_name: 'Maya Patel', table: '4' },
  { id: '5', guest_name: 'Nina Singh', table: '11' },
  { id: '6', guest_name: 'Sreelatha Mundip', table: '8' },
  { id: '7', guest_name: 'Anika Rao', table: '8' },
];

const reportedBugGuests = [
  { id: '8', guest_name: 'Vinod Varapravan', table: '6' },
  { id: '9', guest_name: 'Manoj Varapravan', table: '6' },
  { id: '10', guest_name: 'Leena Varapravan', table: '6' },
  { id: '11', guest_name: 'Jeans Patel', table: '12' },
  { id: '12', guest_name: 'Jaini Patel', table: '14' },
];

describe('guest search', () => {
  it('matches duplicate names and returns each table once', () => {
    const results = findTableMatches('Parth Patel', guests, groupGuestsByTable(guests));

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.table)).toEqual(['4', '11']);
    expect(results[0].tableGuests.map((guest) => guest.guest_name)).toEqual([
      'Parth Patel',
      'Aarav Shah',
      'Maya Patel',
    ]);
  });

  it('matches partial names inside longer names', () => {
    const results = findTableMatches('latha', guests, groupGuestsByTable(guests));

    expect(results).toHaveLength(1);
    expect(results[0].table).toBe('8');
    expect(results[0].matchedGuests[0].guest_name).toBe('Sreelatha Mundip');
  });

  it('scores close full-name searches', () => {
    expect(scoreGuestName('latha mundip', 'sreelatha mundip')).toBeGreaterThan(0);
  });

  it('does not match everyone with the same last name', () => {
    const results = findTableMatches(
      'Vinod Varapravn',
      reportedBugGuests,
      groupGuestsByTable(reportedBugGuests),
    );

    expect(results).toHaveLength(1);
    expect(results[0].matchedGuests.map((guest) => guest.guest_name)).toEqual([
      'Vinod Varapravan',
    ]);
  });

  it('does not match a different first name at another table', () => {
    const results = findTableMatches(
      'Jeans Patel',
      reportedBugGuests,
      groupGuestsByTable(reportedBugGuests),
    );

    expect(results).toHaveLength(1);
    expect(results[0].table).toBe('12');
    expect(results[0].matchedGuests.map((guest) => guest.guest_name)).toEqual([
      'Jeans Patel',
    ]);
  });

  it('returns no results for unrelated names', () => {
    const results = findTableMatches('zzzz unknown', guests, groupGuestsByTable(guests));

    expect(results).toHaveLength(0);
  });
});
