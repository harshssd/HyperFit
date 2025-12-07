import React from 'react';
import { ScrollView, Text } from 'react-native';
import GlassCard from './GlassCard';
import styles from '../styles/appStyles';

const StepsView = () => {
  return (
    <ScrollView style={styles.stepsView} contentContainerStyle={styles.stepsViewContent}>
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.sectionTitle}>STEPS</Text>
        <Text style={styles.emptyCardText}>Nothing here yet. Coming soon.</Text>
      </GlassCard>
    </ScrollView>
  );
};

export default StepsView;

