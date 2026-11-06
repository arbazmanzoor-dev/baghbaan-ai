import { ApiError, predict } from '@/api/client';
import { CONFIDENCE_THRESHOLD } from '@/config';
import { CLASS_IDS, type ClassId } from '@/content/diseases';
import type { Language } from '@/i18n/languages';
import type { ScanRecord } from '@/state/scans';

import { classifyOnDevice, ON_DEVICE_MODEL_VERSION } from './onDevice';
import { prepareImage } from './prepareImage';

export type AnalyseStep = 'prepare' | 'analyse' | 'analyseOffline' | 'save';

export type AnalysisResult = Pick<
  ScanRecord,
  'topClass' | 'confidence' | 'lowConfidence' | 'probabilities' | 'source' | 'modelVersion' | 'offlineReason'
> & { imageUri: string; heatmapBase64: string | null };

type Options = { lang: Language; offlineMode: boolean; onStep: (step: AnalyseStep) => void };

/** Network failures that should fall back to the on-device model rather than fail the scan. */
const isConnectivityError = (err: unknown) =>
  err instanceof ApiError && (err.kind === 'network' || err.kind === 'timeout');

/** Diagnose an already-prepared square photo on the server (with Grad-CAM heatmap). */
export async function analyseOnline(imageUri: string, lang: Language): Promise<AnalysisResult> {
  const response = await predict(imageUri, lang);
  const probabilities = Object.fromEntries(CLASS_IDS.map((id) => [id, 0])) as Record<ClassId, number>;
  for (const p of response.probabilities) probabilities[p.id] = p.probability;
  return {
    imageUri,
    heatmapBase64: response.heatmap_png_base64,
    topClass: response.top_class,
    confidence: response.confidence,
    lowConfidence: response.low_confidence,
    probabilities,
    source: 'online',
    modelVersion: response.model_version,
  };
}

async function analyseOffline(
  imageUri: string,
  offlineReason: NonNullable<ScanRecord['offlineReason']>,
): Promise<AnalysisResult> {
  const probabilities = await classifyOnDevice(imageUri);
  const topClass = CLASS_IDS.reduce((a, b) => (probabilities[b] > probabilities[a] ? b : a));
  const confidence = probabilities[topClass];
  return {
    imageUri,
    heatmapBase64: null, // Grad-CAM needs the full model on the server
    topClass,
    confidence,
    lowConfidence: confidence < CONFIDENCE_THRESHOLD,
    probabilities,
    source: 'offline',
    offlineReason,
    modelVersion: ON_DEVICE_MODEL_VERSION,
  };
}

/**
 * Prepare the photo, then diagnose it: online (with heatmap) by default, on the phone when the
 * user chose offline mode or the server cannot be reached.
 */
export async function analyse(uri: string, { lang, offlineMode, onStep }: Options): Promise<AnalysisResult> {
  onStep('prepare');
  const imageUri = await prepareImage(uri);
  if (!offlineMode) {
    onStep('analyse'); // upload + server-side inference in one request
    try {
      return await analyseOnline(imageUri, lang);
    } catch (err) {
      if (!isConnectivityError(err)) throw err;
    }
  }
  onStep('analyseOffline');
  return analyseOffline(imageUri, offlineMode ? 'setting' : 'unreachable');
}
