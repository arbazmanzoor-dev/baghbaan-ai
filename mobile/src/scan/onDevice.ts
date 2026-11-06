/**
 * Offline inference with the bundled int8 TFLite model (ml/src/baghbaan_ml/export.py).
 *
 * The model takes raw uint8 RGB pixels (input quantisation scale 1, zero point 0) at 224x224
 * and returns float32 probabilities in CLASS_IDS order. Preprocessing mirrors the backend:
 * the photo is already a centre-cropped square (prepareImage), here resized to 224 px.
 */
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';
import type { TfliteModel } from 'react-native-fast-tflite';

import { CLASS_IDS, type ClassId } from '@/content/diseases';

import meta from './model_meta.json';

/** Thrown when the native TFLite module is missing (e.g. running inside Expo Go). */
export class OnDeviceUnavailableError extends Error {}

let modelPromise: Promise<TfliteModel> | null = null;

function loadModel(): Promise<TfliteModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      // Imported lazily so the rest of the app still runs where the native module is absent.
      const tflite = await import('react-native-fast-tflite').catch((err) => {
        throw new OnDeviceUnavailableError(String(err));
      });
      // Assets must be bundled with require(); Metro resolves it at build time.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return tflite.loadTensorflowModel(require('../../assets/model/baghbaan_int8.tflite'), []);
    })().catch((err) => {
      modelPromise = null; // allow a retry after a failed load
      throw err instanceof OnDeviceUnavailableError ? err : new OnDeviceUnavailableError(String(err));
    });
  }
  return modelPromise;
}

/** Decode a square photo into the model's uint8 RGB input tensor. */
async function toInputTensor(squareUri: string): Promise<ArrayBuffer> {
  const size = meta.input_size;
  const resized = await ImageManipulator.manipulate(squareUri)
    .resize({ width: size, height: size })
    .renderAsync();
  const jpeg = await resized.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
  const { data, width, height } = decode(await new File(jpeg.uri).bytes(), {
    useTArray: true,
    formatAsRGBA: false,
  });
  if (width !== size || height !== size) throw new Error(`Unexpected image size ${width}x${height}`);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export const ON_DEVICE_MODEL_VERSION = meta.tflite_file.replace(/\.tflite$/, '');

/** Class probabilities for a centre-cropped square leaf photo, computed on the phone. */
export async function classifyOnDevice(squareUri: string): Promise<Record<ClassId, number>> {
  const [model, input] = await Promise.all([loadModel(), toInputTensor(squareUri)]);
  const [output] = await model.run([input]);
  const probs = new Float32Array(output);
  return Object.fromEntries(meta.labels.map((id, i) => [id, probs[i]])) as Record<ClassId, number>;
}

/** Load the model ahead of time so the first offline scan is fast. Failures are ignored. */
export function warmUpOnDeviceModel(): void {
  loadModel().catch(() => undefined);
}

// Guard against the bundled model and the app disagreeing on class order.
if (meta.labels.join() !== CLASS_IDS.join()) {
  throw new Error('model_meta.json labels do not match CLASS_IDS');
}
