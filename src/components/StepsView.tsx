import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import { stepsStyles, challengesStyles } from '../styles';

const StepsView = () => {
  return (
    <ScrollView style={stepsStyles.stepsView} contentContainerStyle={stepsStyles.stepsViewContent}>
      <GlassCard style={challengesStyles.emptyCard}>
        <Text style={challengesStyles.sectionTitle}>STEPS</Text>
        <Text style={challengesStyles.emptyCardText}>Nothing here yet. Coming soon.</Text>
      </GlassCard>
    </ScrollView>
  );
};

export default StepsView;

