import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touch } from '@/theme/tokens';

import { AppText } from './AppText';

type Chip<T extends string> = { value: T; label: string; count?: number };

/** Horizontally scrolling single-select filter chips (History, Library). */
export function FilterChips<T extends string>({
  chips,
  value,
  onChange,
}: {
  chips: Chip<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((c) => {
        const selected = c.value === value;
        return (
          <Pressable
            key={c.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              Haptics.selectionAsync().catch(() => undefined);
              onChange(c.value);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainer,
                borderColor: selected ? colors.primaryContainer : colors.outlineVariant,
              },
            ]}
          >
            <AppText variant="labelMd" color={selected ? '#ffffff' : colors.onSurface}>
              {c.count === undefined ? c.label : `${c.label} (${c.count})`}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    minHeight: touch.min - 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
