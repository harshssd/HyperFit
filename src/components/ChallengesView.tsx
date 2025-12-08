import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import { challengesStyles } from '../styles';
import EmptyState from './EmptyState';

const ChallengesView = () => {
  return (
    <ScrollView style={challengesStyles.challengesView} contentContainerStyle={challengesStyles.challengesViewContent}>
      <GlassCard style={challengesStyles.emptyCard}>
        <Text style={challengesStyles.sectionTitle}>CHALLENGES</Text>
        <EmptyState title="Nothing here yet" message="Coming soon." />
      </GlassCard>
    </ScrollView>
  );
};

export default ChallengesView;

