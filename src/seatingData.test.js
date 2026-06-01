import { describe, expect, it } from 'vitest';
import { parseSeatingCsv } from './seatingData.js';

describe('seating csv parser', () => {
  it('parses required columns and skips blank rows', () => {
    const guests = parseSeatingCsv(`first_name,last_name,table
Parth,Patel,4
,,
Maya,Patel,4`);

    expect(guests).toHaveLength(2);
    expect(guests[0]).toMatchObject({
      guest_name: 'Parth Patel',
      first_name: 'Parth',
      last_name: 'Patel',
      table: '4',
    });
  });

  it('keeps guests whose table has not been assigned yet', () => {
    const guests = parseSeatingCsv(`first_name,last_name,table
Shefali,Panicker,
Dwij,Padia,`);

    expect(guests).toHaveLength(2);
    expect(guests[0]).toMatchObject({
      guest_name: 'Shefali Panicker',
      table: '',
    });
  });

  it('accepts headers with spaces and capitalization', () => {
    const guests = parseSeatingCsv(`First Name,Last Name,Table
Sreelatha,Mundip,8`);

    expect(guests[0].guest_name).toBe('Sreelatha Mundip');
  });

  it('still accepts legacy guest_name and table columns', () => {
    const guests = parseSeatingCsv(`guest_name,table
Parth Patel,4`);

    expect(guests[0].guest_name).toBe('Parth Patel');
  });

  it('requires usable name and table columns', () => {
    expect(() => parseSeatingCsv('name,seat\nParth,4')).toThrow(
      'first_name and last_name',
    );
  });
});
