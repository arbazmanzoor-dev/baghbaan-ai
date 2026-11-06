/** Runtime configuration. EXPO_PUBLIC_* values are inlined at build time (see mobile/.env.example). */

// Must be referenced literally as process.env.EXPO_PUBLIC_… for Expo to inline it.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

/** Same threshold as the backend: below it the app says "Not sure" instead of a diagnosis. */
export const CONFIDENCE_THRESHOLD = 0.7;

export const REQUEST_TIMEOUT_MS = 30_000;

/** Side length of the square image uploaded / fed to the model (the model resizes to 224). */
export const UPLOAD_SIZE = 512;
