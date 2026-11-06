import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useGalleryPicker } from '@/scan/pickImage';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, touch } from '@/theme/tokens';

const FRAME_INSET = 0.12; // share of the screen width left either side of the framing square
const OVERLAY = 'rgba(18, 22, 20, 0.55)';
const MINT = '#7efba4';

function RoundButton({
  icon,
  label,
  onPress,
  active,
  busy,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: active ? MINT : 'rgba(48, 49, 46, 0.8)', transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Icon name={icon} color={active ? '#00210c' : '#ffffff'} />
      )}
    </Pressable>
  );
}

/** Corner brackets of the leaf framing guide. */
function FrameCorners() {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <View
          key={c}
          style={[
            styles.corner,
            c[0] === 't' ? { top: -2, borderTopWidth: 4 } : { bottom: -2, borderBottomWidth: 4 },
            c[1] === 'l' ? { left: -2, borderLeftWidth: 4 } : { right: -2, borderRightWidth: 4 },
          ]}
        />
      ))}
    </>
  );
}

function PermissionRequest({ canAsk, onAllow }: { canAsk: boolean; onAllow: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const gallery = useGalleryPicker({ replace: true });
  return (
    <Screen
      header={<Header title={t('tabs.scan')} />}
      footer={
        <>
          <Button
            label={canAsk ? t('camera.allow') : t('camera.openSettings')}
            icon="photo-camera"
            onPress={canAsk ? onAllow : () => Linking.openSettings()}
          />
          <Button
            variant="secondary"
            label={t('camera.useGallery')}
            icon="photo-library"
            onPress={gallery.pick}
            disabled={gallery.picking}
          />
        </>
      }
    >
      <View style={styles.permission}>
        <View style={[styles.permissionIcon, { backgroundColor: colors.primaryFixed }]}>
          <Icon name="photo-camera" size={40} color={colors.primary} />
        </View>
        <AppText variant="headlineMd" align="center" accessibilityRole="header">
          {t('camera.permissionTitle')}
        </AppText>
        <AppText align="center" color={colors.onSurfaceVariant}>
          {t('camera.permissionBody')}
        </AppText>
      </View>
    </Screen>
  );
}

export default function Camera() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const gallery = useGalleryPicker({ replace: true });

  if (!permission) return null; // permission status still loading
  if (!permission.granted) {
    return <PermissionRequest canAsk={permission.canAskAgain} onAllow={requestPermission} />;
  }

  const capture = async () => {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.9, shutterSound: false });
      router.replace({ pathname: '/preview', params: { uri: photo.uri } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        // Pause the camera (and light) while the photo picker is up.
        active={!gallery.picking}
        enableTorch={torch && !gallery.picking}
        onCameraReady={() => setReady(true)}
      />

      {/* Dimmed surround with a clear square framing guide in the middle. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.flex, { backgroundColor: OVERLAY }]} />
        <View style={styles.frameRow}>
          <View style={[styles.side, { backgroundColor: OVERLAY }]} />
          <View style={styles.frame}>
            <FrameCorners />
          </View>
          <View style={[styles.side, { backgroundColor: OVERLAY }]} />
        </View>
        <View style={[styles.flex, { backgroundColor: OVERLAY }]} />
      </View>

      <SafeAreaView style={styles.ui} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <RoundButton icon="close" label={t('camera.close')} onPress={() => router.back()} />
          <RoundButton
            icon={torch ? 'flash-on' : 'flash-off'}
            label={torch ? t('camera.lightOff') : t('camera.lightOn')}
            active={torch}
            onPress={() => setTorch((v) => !v)}
          />
        </View>

        <Animated.View entering={FadeIn.delay(300)} style={styles.hint}>
          <Icon name="filter-center-focus" size={20} color={MINT} />
          <AppText variant="labelMd" color="#ffffff" style={styles.flex}>
            {t('camera.hint')}
          </AppText>
        </Animated.View>

        <View style={styles.bottomBar}>
          <View style={styles.sideSlot}>
            <RoundButton
              icon="photo-library"
              label={t('camera.gallery')}
              onPress={gallery.pick}
              busy={gallery.picking}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('camera.capture')}
            accessibilityState={{ disabled: !ready || busy }}
            onPress={capture}
            style={({ pressed }) => [styles.shutterRing, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
          >
            <View style={[styles.shutter, shadows.shutter, { opacity: ready && !busy ? 1 : 0.6 }]}>
              <Icon name="photo-camera" size={30} color="#ffffff" />
            </View>
          </Pressable>
          <View style={styles.sideSlot} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // The viewfinder is a physical layout (shutter centred, close top-left), so it stays LTR.
  root: { flex: 1, backgroundColor: '#000000', direction: 'ltr' },
  flex: { flex: 1 },
  frameRow: { flexDirection: 'row', aspectRatio: 1 },
  side: { width: `${FRAME_INSET * 100}%` },
  frame: { flex: 1, borderRadius: radius.xl },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: MINT, borderRadius: 6 },
  ui: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(48, 49, 46, 0.8)',
    maxWidth: '100%',
  },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md },
  sideSlot: { width: 72, alignItems: 'center' },
  round: { width: touch.min + 4, height: touch.min + 4, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  shutterRing: {
    width: touch.shutter + 16,
    height: touch.shutter + 16,
    borderRadius: (touch.shutter + 16) / 2,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: touch.shutter,
    height: touch.shutter,
    borderRadius: touch.shutter / 2,
    backgroundColor: '#2f5d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  permissionIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
