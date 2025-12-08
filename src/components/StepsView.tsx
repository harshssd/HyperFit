import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import { stepsStyles, challengesStyles } from '../styles';
import EmptyState from './EmptyState';

const StepsView = () => {
  return (
    <ScrollView style={stepsStyles.stepsView} contentContainerStyle={stepsStyles.stepsViewContent}>
      <GlassCard style={challengesStyles.emptyCard}>
        <Text style={challengesStyles.sectionTitle}>STEPS</Text>
        <EmptyState title="Nothing here yet" message="Coming soon." />
      </GlassCard>
    </ScrollView>
  );
};

export default StepsView;

