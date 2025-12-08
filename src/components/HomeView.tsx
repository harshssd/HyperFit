import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import GlassCard from './GlassCard';
import { homeStyles } from '../styles';

type HomeViewProps = {
  data: any;
  onChangeView: (view: string) => void;
  streak: number;
  xp: number;
};

const HomeView = ({ data, onChangeView, streak, xp }: HomeViewProps) => {
  return (
    <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
      <GlassCard style={homeStyles.homeCard}>
        <Text style={homeStyles.homeCardTitle}>WELCOME BACK</Text>
        <Text style={homeStyles.homeCardSubtitle}>Ready to train?</Text>
        <Text style={homeStyles.homeCardSubtitle}>Streak: {streak} | XP: {xp}</Text>
      </GlassCard>
      <TouchableOpacity onPress={() => onChangeView('gym')} style={homeStyles.homeQuickAction}>
        <Dumbbell size={24} color="#f97316" />
        <Text style={homeStyles.homeQuickActionText}>START WORKOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeView;

