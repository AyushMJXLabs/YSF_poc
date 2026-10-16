import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';

/**
 * Kaushalya design tokens — taken from the "Manpower Portal" reference:
 * cool off-white canvas, white rounded cards, a deep navy hero surface,
 * teal accents, and small uppercase micro-labels.
 */
export const colors = {
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F7',
  line: '#E6E9EF',
  lineStrong: '#D5DAE3',

  ink: '#111827',
  ink2: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',

  navy: '#111A33',
  navy2: '#1B2647',
  navyInk: '#FFFFFF',
  navyMuted: '#8D97B5',

  teal: '#1F7A72',
  tealDark: '#17605A',
  tealSoft: '#E3F2F0',
  cyan: '#9BE7F2',

  green: '#16A34A',
  greenSoft: '#DCFCE7',
  red: '#E5484D',
  redSoft: '#FDECEC',
  amber: '#B7791F',
  amberSoft: '#FEF3C7',
  blue: '#2563EB',
  blueSoft: '#E8EFFE',
  violet: '#7C3AED',
  violetSoft: '#F1EAFE',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

export const shadow: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export const type = StyleSheet.create({
  micro: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.muted },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  body: { fontSize: 14, color: colors.ink2 },
  caption: { fontSize: 12, color: colors.muted },
});

type Tone = 'teal' | 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'neutral' | 'navy';

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  teal: { bg: colors.tealSoft, fg: colors.teal },
  green: { bg: colors.greenSoft, fg: colors.green },
  red: { bg: colors.redSoft, fg: colors.red },
  amber: { bg: colors.amberSoft, fg: colors.amber },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  violet: { bg: colors.violetSoft, fg: colors.violet },
  neutral: { bg: colors.surfaceMuted, fg: colors.muted },
  navy: { bg: 'rgba(34,197,94,0.14)', fg: '#4ADE80' },
};

export const toneColors = (tone: Tone) => toneMap[tone];

export const Card: React.FC<{ style?: StyleProp<ViewStyle>; children: React.ReactNode; dark?: boolean }> = ({ style, children, dark }) => (
  <View style={[styles.card, dark && styles.cardDark, style]}>{children}</View>
);

export const Pill: React.FC<{ label: string; tone?: Tone; dot?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle> }> = ({
  label,
  tone = 'teal',
  dot,
  style,
  textStyle,
}) => {
  const c = toneMap[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, style]}>
      {dot ? <View style={[styles.pillDot, { backgroundColor: c.fg }]} /> : null}
      <Text style={[styles.pillText, { color: c.fg }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

export const SectionHeader: React.FC<{ title: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ title, right, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={type.title}>{title}</Text>
    {right}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    ...shadow,
  },
  cardDark: {
    backgroundColor: colors.navy,
    borderColor: colors.navy2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  pillText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});
