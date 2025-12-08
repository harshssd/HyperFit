import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import { statsStyles } from '../styles';
import { getRank, calculateXP } from '../features/workout/helpers';

type StatsViewProps = {
  data: any;
};

const StatsView = ({ data }: StatsViewProps) => {
  const xp = calculateXP(data);
  const currentRank = getRank(xp);

  return (
    <ScrollView style={statsStyles.statsView} contentContainerStyle={statsStyles.statsViewContent}>
      <GlassCard style={statsStyles.statsCard}>
        <Text style={statsStyles.statsCardTitle}>TOTAL XP</Text>
        <Text style={statsStyles.statsCardValue}>{xp.toLocaleString()}</Text>
      </GlassCard>
      <GlassCard style={statsStyles.statsCard}>
        <Text style={statsStyles.statsCardTitle}>RANK</Text>
        <Text style={[statsStyles.statsCardValue, { color: currentRank.color }]}>{currentRank.title}</Text>
      </GlassCard>
      <GlassCard style={statsStyles.statsCard}>
        <Text style={statsStyles.statsCardTitle}>GYM SESSIONS</Text>
        <Text style={statsStyles.statsCardValue}>{data?.gymLogs?.length || 0}</Text>
      </GlassCard>
    </ScrollView>
  );
};

export default StatsView;

