import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import styles from '../styles/appStyles';

const ChallengesView = () => {
  return (
    <ScrollView style={styles.challengesView} contentContainerStyle={styles.challengesViewContent}>
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.sectionTitle}>CHALLENGES</Text>
        <Text style={styles.emptyCardText}>Nothing here yet. Coming soon.</Text>
      </GlassCard>
    </ScrollView>
  );
};

export default ChallengesView;

