import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import { palette, text, accent, fonts, space } from '../../../styles/theme';
import type { Trajectory } from '../hooks/useSessionTrajectories';

type Props = {
  /** Local YYYY-MM-DD or ISO datetime — formatted contextually
   *  (TODAY / YESTERDAY / WED · MAY 03). */
  date: string;
  name: string;
  volumeLoad: number;
  /** ISO datetime when the session started — surfaced as a small
   *  "09:57 AM" caption next to the date. Optional; omitted if null. */
  startTime?: string | null;
  /** Total session duration in seconds. */
  durationSeconds?: number | null;
  /** Distinct exercises in the session. */
  exerciseCount?: number;
  /** Total sets across all exercises. */
  setCount?: number;
  trajectory?: Trajectory;
  onPress: () => void;
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** Render dates contextually so the most-recent rows are scannable.
 *  TODAY / YESTERDAY beat numerics for recall; everything older lands as
 *  "WED · MAY 03" so you get day-of-week context without scanning the whole
 *  list. Years only show when it's not the current year. */
const formatRelativeDate = (raw: string): string => {
  const d = new Date(raw.length <= 10 ? raw + 'T00:00:00' : raw);
  if (Number.isNaN(d.getTime())) return raw;
  // Use local Y/M/D components on both sides so a session timestamp in
  // UTC ('Z') still compares against the user's local calendar day. The
  // prior epoch-ms diff broke for late-night logs whose UTC date had
  // already rolled to "tomorrow" while the user was still on yesterday.
  // Local-component subtraction is also DST-immune (no 23h/25h skew).
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (dayDiff === 0) return 'TODAY';
  if (dayDiff === 1) return 'YESTERDAY';
  const weekday = WEEKDAYS[d.getDay()];
  const month = MONTHS[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const includeYear = d.getFullYear() !== today.getFullYear();
  return includeYear
    ? `${weekday} · ${month} ${day} ${d.getFullYear()}`
    : `${weekday} · ${month} ${day}`;
};

const formatStartTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase();
};

const formatDuration = (seconds: number | null | undefined): string | null => {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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
    return (
      <Svg width={40} height={14} viewBox="0 0 40 14">
        <Polyline points="2,7 38,7" fill="none" stroke={text.disabled} strokeWidth="1.2" />
      </Svg>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 40;
  const height = 14;
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

// Trend indicator: glyph + color (was color-only). Glyph carries the signal
// for users with red/green deficiency; color reinforces it for everyone else.
const TrendDot = ({ trend }: { trend: Trajectory['trend'] }) => {
  if (trend === 'none') {
    return (
      <Text style={[styles.trendGlyph, { color: text.quaternary }]} accessibilityLabel="no prior session">
        ·
      </Text>
    );
  }
  const color =
    trend === 'up' ? accent.sessionUp
    : trend === 'down' ? accent.regression
    : text.quaternary;
  const glyph = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '·';
  const label = trend === 'up' ? 'session up' : trend === 'down' ? 'session down' : 'session unchanged';
  return (
    <Text style={[styles.trendGlyph, { color }]} accessibilityLabel={label}>
      {glyph}
    </Text>
  );
};

/**
 * Two-line session row. Top line carries the identifying info — date pill,
 * session name, sparkline+trend, chevron. Bottom line is the metadata strip:
 * start time, duration, exercise count, set count, volume. Bullets separate
 * the metric tokens so the eye can chunk them; "—" suppresses anything we
 * don't have data for instead of printing zeros that look like real values.
 */
const SessionRow = ({
  date,
  name,
  volumeLoad,
  startTime,
  durationSeconds,
  exerciseCount,
  setCount,
  trajectory,
  onPress,
}: Props) => {
  const traj = trajectory ?? { sparkPoints: [], trend: 'none' as const };
  const dateLabel = formatRelativeDate(date);
  const timeLabel = formatStartTime(startTime);
  const durationLabel = formatDuration(durationSeconds);
  const volumeLabel = formatVolume(volumeLoad);

  // Metadata tokens — only emit ones we actually have data for. Bullets
  // join non-empty pieces so a session missing duration doesn't render
  // " · · 5 ex".
  const metaParts: string[] = [];
  if (timeLabel) metaParts.push(timeLabel);
  if (durationLabel) metaParts.push(durationLabel);
  if (exerciseCount && exerciseCount > 0) {
    metaParts.push(`${exerciseCount} EX`);
  }
  if (setCount && setCount > 0) {
    metaParts.push(`${setCount} SETS`);
  }
  if (volumeLabel !== '—') {
    metaParts.push(`${volumeLabel} LBS`);
  }
  const metaLine = metaParts.join(' · ');

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${dateLabel}${metaLine ? ', ' + metaLine : ''}`}
    >
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.spark}>
            <Sparkline points={traj.sparkPoints} trend={traj.trend} />
          </View>
          <TrendDot trend={traj.trend} />
        </View>
        {metaLine.length > 0 && (
          <Text style={styles.meta} numberOfLines={1}>
            {metaLine}
          </Text>
        )}
      </View>
      <ChevronRight size={16} color={text.quaternary} style={styles.chevron} />
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
    gap: space.sm,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  date: {
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    fontSize: 10,
    color: accent.lift,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: text.primary,
    fontWeight: '600',
  },
  meta: {
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    fontSize: 10,
    color: text.tertiary,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  spark: {
    width: 40,
    height: 14,
    justifyContent: 'center',
  },
  trendGlyph: {
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
    minWidth: 10,
    textAlign: 'center',
  },
  chevron: {
    marginLeft: 2,
  },
});

export default SessionRow;
