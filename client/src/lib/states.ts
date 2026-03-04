/**
 * US State constants and utilities for The Commons
 */

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington D.C.',
};

export const STATE_CODES = Object.keys(STATE_NAMES) as Array<keyof typeof STATE_NAMES>;

// Regions for grouping states in browse UI
export const REGIONS: Record<string, { label: string; states: string[] }> = {
  northeast: {
    label: 'Northeast',
    states: ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT', 'DC'],
  },
  southeast: {
    label: 'Southeast',
    states: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  },
  midwest: {
    label: 'Midwest',
    states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  },
  west: {
    label: 'West',
    states: ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'],
  },
  southwest: {
    label: 'Southwest',
    states: ['TX', 'OK'],
  },
};

export function getStateName(code: string): string {
  return STATE_NAMES[code.toUpperCase()] || code;
}

export function isValidStateCode(code: string): boolean {
  return code.toUpperCase() in STATE_NAMES;
}

// Home state persistence (localStorage for anonymous users)
const HOME_STATE_KEY = 'commons_home_state';

export function getHomeState(): string | null {
  try {
    return localStorage.getItem(HOME_STATE_KEY);
  } catch {
    return null;
  }
}

export function setHomeState(code: string): void {
  try {
    localStorage.setItem(HOME_STATE_KEY, code.toUpperCase());
  } catch {
    // localStorage may be unavailable
  }
}

export function clearHomeState(): void {
  try {
    localStorage.removeItem(HOME_STATE_KEY);
  } catch {
    // localStorage may be unavailable
  }
}
