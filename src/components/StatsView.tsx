import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import styles from '../styles/appStyles';
import { getRank, calculateXP } from '../features/workout/helpers';

type StatsViewProps = {
  data: any;
};

const StatsView = ({ data }: StatsViewProps) => {
  const xp = calculateXP(data);
  const currentRank = getRank(xp);

  return (
    <ScrollView style={styles.statsView} contentContainerStyle={styles.statsViewContent}>
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>TOTAL XP</Text>
        <Text style={styles.statsCardValue}>{xp.toLocaleString()}</Text>
      </GlassCard>
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>RANK</Text>
        <Text style={[styles.statsCardValue, { color: currentRank.color }]}>{currentRank.title}</Text>
      </GlassCard>
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>GYM SESSIONS</Text>
        <Text style={styles.statsCardValue}>{data?.gymLogs?.length || 0}</Text>
      </GlassCard>
    </ScrollView>
  );
};

export default StatsView;

