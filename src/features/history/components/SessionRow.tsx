import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { palette, text, accent, fonts, space } from '../../../styles/theme';
import type { Trajectory } from '../hooks/useSessionTrajectories';

type Props = {
  /** Local YYYY-MM-DD or ISO datetime — formatted to "MMM DD" caps. */
  date: string;
  name: string;
  volumeLoad: number;
  trajectory?: Trajectory;
  onPress: () => void;
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const formatDate = (raw: string): string => {
  // Accept "YYYY-MM-DD" or full ISO; both work via Date parsing.
  const d = new Date(raw.length <= 10 ? raw + 'T00:00:00' : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
};

const formatVolume = (n: number): string => {
  if (!Number.isFinite(n) || n === 0) return '—';
  if (n >= 10_000) return n.toLocaleString();
  return Math.round(n).toLocaleString();
};

const Sparkline = ({
  points,
  trend,
}: {
  points: number[];
  trend: Trajectory['trend'];
}) => {
  if (points.length < 2) {
    // Not enough data for a meaningful spark — render a flat hairline.
    return (
      <Svg width={48} height={18} viewBox="0 0 48 18">
        <Polyline
          points="2,9 46,9"
          fill="none"
          stroke={text.disabled}
          strokeWidth="1.2"
        />
      </Svg>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 48;
  const height = 18;
  const stepX = (width - 4) / (points.length - 1);
  const coords = points
    .map((v, i) => {
      const x = 2 + i * stepX;
      const y = 2 + (1 - (v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke =
    trend === 'up' ? accent.sessionUp
    : trend === 'down' ? accent.regression
    : text.tertiary;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline points={coords} fill="none" stroke={stroke} strokeWidth="1.4" />
    </Svg>
  );
};

const TrendDot = ({ trend }: { trend: Trajectory['trend'] }) => {
  if (trend === 'none') return <View style={[styles.dot, styles.dotNone]} />;
  const bg =
    trend === 'up' ? accent.sessionUp
    : trend === 'down' ? accent.regression
    : text.quaternary;
  return <View style={[styles.dot, { backgroundColor: bg }]} />;
};

const SessionRow = ({ date, name, volumeLoad, trajectory, onPress }: Props) => {
  const traj = trajectory ?? { sparkPoints: [], trend: 'none' as const };
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatDate(date)}, volume ${formatVolume(volumeLoad)}`}
    >
      <Text style={styles.date}>{formatDate(date)}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.volume}>{formatVolume(volumeLoad)}</Text>
      <View style={styles.spark}>
        <Sparkline points={traj.sparkPoints} trend={traj.trend} />
      </View>
      <TrendDot trend={traj.trend} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderColor: palette.borderSubtle,
    gap: space.md,
  },
  date: {
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    fontSize: 11,
    color: text.tertiary,
    letterSpacing: 0.6,
    minWidth: 56,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: text.primary,
    fontWeight: '500',
  },
  volume: {
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    fontSize: 13,
    color: text.primary,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'right',
  },
  spark: {
    width: 48,
    height: 18,
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotNone: {
    backgroundColor: palette.borderStrong,
    opacity: 0.7,
  },
});

export default SessionRow;
