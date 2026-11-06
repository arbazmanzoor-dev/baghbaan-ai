/** Typed client for the BaghBaan FastAPI backend (see backend/app/schemas.py). */
import { File } from 'expo-file-system';

import { API_URL, REQUEST_TIMEOUT_MS } from '@/config';
import type { ClassId } from '@/content/diseases';
import type { Language } from '@/i18n/languages';

export type PredictResponse = {
  prediction: ClassId | null;
  top_class: ClassId;
  confidence: number;
  low_confidence: boolean;
  confidence_threshold: number;
  probabilities: { id: ClassId; name: string; probability: number }[];
  heatmap_png_base64: string | null;
  expert_note: string;
  language: Language;
  model_version: string;
  inference_ms: number;
};

export type Metrics = {
  generated_at: string;
  model: { name: string; backbone: string; input_size: number; params: number };
  dataset: { name: string; per_split: Record<string, number> };
  test: {
    accuracy: number;
    macro_f1: number;
    per_class: Record<ClassId, { precision: number; recall: number; f1: number; support: number }>;
  };
  confidence: { threshold: number; coverage: number; accuracy_when_confident: number };
  tflite?: { size_mb: number; test_accuracy: number };
};

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'bad_image'
  | 'unauthorized'
  | 'conflict'
  | 'invalid'
  | 'server';

const STATUS_KINDS: Record<number, ApiErrorKind> = {
  400: 'bad_image',
  401: 'unauthorized',
  409: 'conflict',
  413: 'bad_image',
  415: 'bad_image',
  422: 'invalid',
  429: 'rate_limited',
};

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    throw controller.signal.aborted
      ? new ApiError('timeout', 'The server took too long to respond')
      : new ApiError('network', err instanceof Error ? err.message : 'Network request failed');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((b: { detail?: unknown }) => b.detail)
      .catch(() => undefined);
    // FastAPI validation errors return a list of issues instead of a string.
    const message = typeof detail === 'string' ? detail : `HTTP ${response.status}`;
    throw new ApiError(STATUS_KINDS[response.status] ?? 'server', message);
  }
  return (await response.json()) as T;
}

/** Upload a (square, resized) JPEG and get the diagnosis with a Grad-CAM heatmap. */
export function predict(imageUri: string, lang: Language): Promise<PredictResponse> {
  const form = new FormData();
  // Expo's fetch (the global in SDK 58) needs a real Blob; expo-file-system's File is one.
  form.append('file', new File(imageUri), 'leaf.jpg');
  return request<PredictResponse>(`/predict?lang=${lang}&heatmap=true`, { method: 'POST', body: form });
}

export const fetchMetrics = () => request<Metrics>('/metrics');

export const fetchHealth = () =>
  request<{ status: 'ok'; model_loaded: boolean; model_version: string | null }>('/health');

// --------------------------------------------------------------------------- accounts

export type Role = 'farmer' | 'officer';

export type User = { id: number; phone: string; name: string; role: Role; created_at: string };

export type Session = { access_token: string; token_type: 'bearer'; expires_at: string; user: User };

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const signUp = (body: { name: string; phone: string; password: string; role: Role }) =>
  request<Session>('/auth/signup', json(body));

export const logIn = (body: { phone: string; password: string }) =>
  request<Session>('/auth/login', json(body));

export const fetchMe = (token: string) =>
  request<User>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
