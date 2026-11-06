import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { UPLOAD_SIZE } from '@/config';

/**
 * Centre-crop to a square and resize, matching the backend's preprocessing (and what the
 * camera's framing guide shows). Also shrinks multi-megabyte photos before upload.
 */
export async function prepareImage(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri, {
    maxWidth: UPLOAD_SIZE * 4,
    maxHeight: UPLOAD_SIZE * 4,
  }).renderAsync();
  const side = Math.min(original.width, original.height);
  const square = await ImageManipulator.manipulate(original)
    .crop({
      originX: Math.floor((original.width - side) / 2),
      originY: Math.floor((original.height - side) / 2),
      width: side,
      height: side,
    })
    .resize({ width: UPLOAD_SIZE, height: UPLOAD_SIZE })
    .renderAsync();
  const saved = await square.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return saved.uri;
}
