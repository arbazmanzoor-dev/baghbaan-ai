import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import type { ComponentProps } from 'react';

import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  /** Mirror in right-to-left layouts (arrows, chevrons). */
  directional?: boolean;
};

/** Material icons (the design uses Material Symbols; these are the same glyph family). */
export function Icon({ name, size = 24, color, directional = false }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useSettings();
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color ?? colors.onSurface}
      style={directional && isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
