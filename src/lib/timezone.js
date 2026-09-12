// Property.timezone is a real IANA zone (e.g. "Asia/Dubai"), set in
// PropertySettings.jsx. Front desk / dashboard "today" boundaries must use
// it — a staff member in Paris looking at a Dubai property should see
// Dubai's today, not their own browser's.

export function getPropertyToday(property) {
  const tz = property?.timezone || 'UTC';
  try {
    // en-CA locale formats as YYYY-MM-DD directly, no string surgery needed.
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  } catch {
    // Invalid/unsupported IANA zone name — fall back rather than crash.
    return new Date().toISOString().split('T')[0];
  }
}

export function formatInPropertyTz(dateInput, property, options = {}) {
  const tz = property?.timezone || 'UTC';
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, ...options }).format(new Date(dateInput));
  } catch {
    return new Date(dateInput).toLocaleString(undefined, options);
  }
}
