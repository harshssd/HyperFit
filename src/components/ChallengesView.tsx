import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import { challengesStyles } from '../styles';

const ChallengesView = () => {
  return (
    <ScrollView style={challengesStyles.challengesView} contentContainerStyle={challengesStyles.challengesViewContent}>
      <GlassCard style={challengesStyles.emptyCard}>
        <Text style={challengesStyles.sectionTitle}>CHALLENGES</Text>
        <Text style={challengesStyles.emptyCardText}>Nothing here yet. Coming soon.</Text>
      </GlassCard>
    </ScrollView>
  );
};

export default ChallengesView;

