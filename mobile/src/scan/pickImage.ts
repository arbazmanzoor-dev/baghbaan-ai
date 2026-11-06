import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

/** Opens the photo library; returns the chosen image URI, or null if cancelled. */
export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  return result.canceled ? null : result.assets[0].uri;
}

/**
 * Gallery flow shared by Home and the camera screen. The system picker can take several
 * seconds to appear the first time, so this exposes `picking` for a spinner, ignores repeat
 * taps while it opens (a second launch would fail silently) and reports failures.
 */
export function useGalleryPicker({ replace = false }: { replace?: boolean } = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const busy = useRef(false);

  const pick = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setPicking(true);
    try {
      const uri = await pickImage();
      if (uri) {
        const target = { pathname: '/preview' as const, params: { uri } };
        if (replace) router.replace(target);
        else router.push(target);
      }
    } catch {
      Alert.alert(t('camera.galleryErrorTitle'), t('camera.galleryErrorBody'));
    } finally {
      busy.current = false;
      setPicking(false);
    }
  }, [replace, router, t]);

  return { pick, picking };
}
