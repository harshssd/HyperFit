import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { palette, text, accent, fonts, space } from '../../../styles/theme';

type Props = {
  /** Display name — e.g. "Squats Day". */
  name: string;
  /** Eyebrow context — e.g. "LIVE · LEG DAY · WEEK 3". */
  eyebrow?: string;
  /** Live total volume (lbs × reps) for the session in progress. */
  volume: number;
  /** Volume of the most recent prior session of the same type. */
  prevVolume: number | null;
  /** Optional date label of the prior session, e.g. "vs last leg day". */
  prevLabel?: string;
};

const formatVol = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (n >= 10_000) return n.toLocaleString();
  return Math.round(n).toLocaleString();
};

const SessionHero = ({
  name,
  eyebrow,
  volume,
  prevVolume,
  prevLabel = 'vs last session',
}: Props) => {
  const delta = prevVolume !== null && prevVolume > 0 ? volume - prevVolume : null;
  const deltaSign = delta === null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const deltaColor =
    deltaSign === 'up'
      ? accent.sessionUp
      : deltaSign === 'down'
        ? accent.regression
        : text.tertiary;
  const deltaArrow = deltaSign === 'up' ? '▲' : deltaSign === 'down' ? '▼' : '•';
  const deltaText =
    delta === null ? null : `${deltaArrow} ${delta > 0 ? '+' : ''}${formatVol(delta)}`;

  return (
    <View style={styles.hero}>
      {/* Radial-orange tint via two stacked linear gradients (RN doesn't have native radial). */}
      <ExpoGradient
        colors={['rgba(252,76,2,0.55)', 'rgba(252,76,2,0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ExpoGradient
        colors={['rgba(0,214,143,0.0)', 'rgba(0,214,143,0.22)']}
        start={{ x: 0.4, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Decorative volume curve — SVG polyline, ~60% opacity. */}
      <Svg
        viewBox="0 0 360 200"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="hgrad" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={accent.sessionUp} stopOpacity={0.32} />
            <Stop offset="1" stopColor={accent.sessionUp} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path
          d="M0,170 L40,160 L80,165 L120,140 L160,135 L200,115 L240,108 L280,85 L320,70 L360,55 L360,200 L0,200 Z"
          fill="url(#hgrad)"
        />
        <Polyline
          points="0,170 40,160 80,165 120,140 160,135 200,115 240,108 280,85 320,70 360,55"
          fill="none"
          stroke={accent.sessionUp}
          strokeWidth="1.3"
          opacity={0.7}
        />
      </Svg>

      {/* Bottom-fade — keeps the gradient from competing with the exercise list. */}
      <ExpoGradient
        colors={['transparent', palette.bg]}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.content} pointerEvents="none">
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.volume}>{formatVol(volume)}</Text>
          {deltaText ? (
            <Text style={[styles.delta, { color: deltaColor }]}>{deltaText}</Text>
          ) : null}
          {delta !== null ? <Text style={styles.vs}>{prevLabel}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    height: 200,
    backgroundColor: palette.bgHeroTint,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: -space.lg,
    marginTop: -space.md,
    marginBottom: space.lg,
  },
  content: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: accent.lift,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: space['2sm'],
  },
  name: {
    fontSize: 30,
    fontWeight: '900',
    color: text.primary,
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.md,
    marginTop: space.md,
    flexWrap: 'wrap',
  },
  volume: {
    fontSize: 32,
    fontWeight: '800',
    color: text.primary,
    fontVariant: fonts.tabularNums,
    letterSpacing: -0.5,
  },
  delta: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: fonts.tabularNums,
    letterSpacing: 0.2,
  },
  vs: {
    fontSize: 11,
    color: text.tertiary,
  },
});

export default SessionHero;
