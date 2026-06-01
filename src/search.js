const maxResults = 8;

export function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function groupGuestsByTable(guests) {
  return guests.reduce((groups, guest) => {
    const tableKey = getGuestTableKey(guest);

    if (!groups.has(tableKey)) {
      groups.set(tableKey, {
        table: guest.table,
        guests: [],
      });
    }

    groups.get(tableKey).guests.push(guest);
    return groups;
  }, new Map());
}

export function findTableMatches(query, guests, guestsByTable) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  const scoredGuests = guests
    .map((guest) => ({
      guest,
      score: scoreGuestName(normalizedQuery, normalizeText(guest.guest_name)),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.guest.guest_name.localeCompare(b.guest.guest_name));

  const tableMatches = new Map();

  for (const { guest, score } of scoredGuests) {
    const tableKey = getGuestTableKey(guest);

    if (!tableMatches.has(tableKey)) {
      const tableGroup = guestsByTable.get(tableKey);

      tableMatches.set(tableKey, {
        table: tableGroup.table,
        tableGuests: tableGroup.guests,
        matchedGuests: [],
        bestScore: score,
      });
    }

    tableMatches.get(tableKey).matchedGuests.push(guest);
  }

  return Array.from(tableMatches.values())
    .sort((a, b) => b.bestScore - a.bestScore || compareTables(a.table, b.table))
    .slice(0, maxResults);
}

export function scoreGuestName(query, guestName) {
  if (!query || !guestName) {
    return 0;
  }

  const queryParts = splitName(query);
  const guestParts = splitName(guestName);

  if (queryParts.length >= 2 && guestParts.length >= 2) {
    return scoreFullName(queryParts, guestParts);
  }

  if (guestName === query) {
    return 100;
  }

  if (guestName.includes(query)) {
    return query.length >= 3 ? 90 : 40;
  }

  const queryTokens = query.split(' ');
  const nameTokens = guestName.split(' ');
  const tokenScore = scoreTokens(queryTokens, nameTokens);

  if (tokenScore >= 70) {
    return tokenScore;
  }

  const distance = levenshteinDistance(query, guestName);
  const longestLength = Math.max(query.length, guestName.length);
  const similarity = Math.round((1 - distance / longestLength) * 100);
  const minimumSimilarity = query.length <= 4 ? 82 : 68;

  return similarity >= minimumSimilarity ? similarity : 0;
}

function splitName(name) {
  return name.split(' ').filter(Boolean);
}

function scoreFullName(queryParts, guestParts) {
  const queryFirstName = queryParts[0];
  const queryLastName = queryParts.slice(1).join(' ');
  const guestFirstName = guestParts[0];
  const guestLastName = guestParts.slice(1).join(' ');

  const lastNameScore = scoreLastName(queryLastName, guestLastName);

  if (lastNameScore === 0) {
    return 0;
  }

  const firstNameScore = scoreFirstName(queryFirstName, guestFirstName);

  if (firstNameScore === 0) {
    return 0;
  }

  return Math.round(firstNameScore * 0.65 + lastNameScore * 0.35);
}

function scoreFirstName(queryFirstName, guestFirstName) {
  if (guestFirstName === queryFirstName) {
    return 100;
  }

  if (guestFirstName.includes(queryFirstName) && queryFirstName.length >= 3) {
    return 88;
  }

  if (queryFirstName.includes(guestFirstName) && guestFirstName.length >= 3) {
    return 82;
  }

  const distance = levenshteinDistance(queryFirstName, guestFirstName);
  const longestLength = Math.max(queryFirstName.length, guestFirstName.length);
  const similarity = Math.round((1 - distance / longestLength) * 100);

  return similarity >= 80 ? similarity : 0;
}

function scoreLastName(queryLastName, guestLastName) {
  if (guestLastName === queryLastName) {
    return 100;
  }

  const distance = levenshteinDistance(queryLastName, guestLastName);
  const longestLength = Math.max(queryLastName.length, guestLastName.length);
  const similarity = Math.round((1 - distance / longestLength) * 100);

  return similarity >= 90 ? similarity : 0;
}

function scoreTokens(queryTokens, nameTokens) {
  const scores = queryTokens.map((queryToken) => {
    const bestTokenScore = Math.max(
      ...nameTokens.map((nameToken) => scoreToken(queryToken, nameToken)),
    );

    return bestTokenScore;
  });

  const averageScore =
    scores.reduce((total, score) => total + score, 0) / scores.length;

  return Math.round(averageScore);
}

function scoreToken(queryToken, nameToken) {
  if (nameToken === queryToken) {
    return 100;
  }

  if (nameToken.includes(queryToken) && queryToken.length >= 3) {
    return 88;
  }

  if (queryToken.includes(nameToken) && nameToken.length >= 3) {
    return 82;
  }

  const distance = levenshteinDistance(queryToken, nameToken);
  const longestLength = Math.max(queryToken.length, nameToken.length);
  const similarity = Math.round((1 - distance / longestLength) * 100);

  return similarity >= 75 ? similarity : 0;
}

function normalizeTable(table) {
  return normalizeText(String(table));
}

function getGuestTableKey(guest) {
  const tableKey = normalizeTable(guest.table);
  return tableKey || `unassigned-${guest.id}`;
}

function compareTables(a, b) {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);

  for (let column = 1; column <= a.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      const substitutionCost = a[column - 1] === b[row - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      );
    }
  }

  return matrix[b.length][a.length];
}
