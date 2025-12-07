import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import GlassCard from './GlassCard';
import styles from '../styles/appStyles';

type HomeViewProps = {
  data: any;
  onChangeView: (view: string) => void;
  streak: number;
  xp: number;
};

const HomeView = ({ data, onChangeView, streak, xp }: HomeViewProps) => {
  return (
    <ScrollView style={styles.homeView} contentContainerStyle={styles.homeViewContent}>
      <GlassCard style={styles.homeCard}>
        <Text style={styles.homeCardTitle}>WELCOME BACK</Text>
        <Text style={styles.homeCardSubtitle}>Ready to train?</Text>
        <Text style={styles.homeCardSubtitle}>Streak: {streak} | XP: {xp}</Text>
      </GlassCard>
      <TouchableOpacity onPress={() => onChangeView('gym')} style={styles.homeQuickAction}>
        <Dumbbell size={24} color="#f97316" />
        <Text style={styles.homeQuickActionText}>START WORKOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeView;

