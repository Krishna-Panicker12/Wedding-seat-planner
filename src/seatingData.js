import Papa from 'papaparse';

const legacyColumns = ['guest_name', 'table'];
const splitNameColumns = ['first_name', 'last_name'];

export async function loadSeatingCsv(url) {
  const response = await fetch(withCacheBust(url), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to load the seating chart. Please try again.');
  }

  const csvText = await response.text();
  return parseSeatingCsv(csvText);
}

export function parseSeatingCsv(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeHeader(header),
    transform: (value) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error('The seating chart could not be read.');
  }

  const fields = parsed.meta.fields || [];
  const hasLegacyColumns = legacyColumns.every((column) =>
    fields.includes(column),
  );
  const hasSplitNameColumns = splitNameColumns.every((column) =>
    fields.includes(column),
  );

  if (!hasLegacyColumns && !hasSplitNameColumns) {
    throw new Error(
      'The seating chart must include first_name and last_name columns.',
    );
  }

  return parsed.data
    .map((row, index) => normalizeGuestRow(row, index, hasSplitNameColumns))
    .filter(Boolean);
}

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizeGuestRow(row, index, useSplitNameColumns) {
  const guestName = useSplitNameColumns
    ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
    : row.guest_name;

  if (!guestName) {
    return null;
  }

  return {
    id: `${guestName}-${row.table}-${index}`,
    guest_name: guestName,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    table: row.table || '',
  };
}

function withCacheBust(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}
