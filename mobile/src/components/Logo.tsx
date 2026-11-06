import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** BaghBaan leaf mark: an apple leaf with a central vein, after the Stitch splash badge. */
export function LeafMark({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="leaf" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#164525" />
          <Stop offset="0.6" stopColor="#2f5d3a" />
          <Stop offset="1" stopColor="#61de8a" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 54C10 34 22 12 52 8c2 26-12 44-40 46z"
        fill="url(#leaf)"
      />
      <Path
        d="M12 54C22 42 32 30 46 16M24 41l-1-10M31 33l8 1M37 26l-1-8"
        stroke="#fbf9f4"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
