/** Mirrors backend/app/auth.py normalise_phone: returns +91XXXXXXXXXX or null if invalid. */
export function normalisePhone(value: string): string | null {
  const digits = value
    .replace(/[\s\-()]/g, '')
    .replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
