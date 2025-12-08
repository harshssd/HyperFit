import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Medal, RotateCcw, PlusCircle } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import workoutStyles from '../../../styles/workout';

type FinishedSessionViewProps = {
  visibleWorkout: any[];
  calculateTotalVolume: () => number;
  onStartNewSession: () => void;
  onUndo: () => void;
};

const FinishedSessionView = ({
  visibleWorkout,
  calculateTotalVolume,
  onStartNewSession,
  onUndo,
}: FinishedSessionViewProps) => {
  return (
    <ScrollView contentContainerStyle={workoutStyles.finishedContainer}>
      <View style={workoutStyles.finishedIcon}>
        <Medal size={48} color="#22d3ee" />
      </View>
      <View style={workoutStyles.finishedText}>
        <Text style={workoutStyles.finishedTitle}>SESSION COMPLETE</Text>
        <Text style={workoutStyles.finishedSubtitle}>DATA UPLOADED SUCCESSFULLY</Text>
      </View>
      <View style={workoutStyles.finishedStats}>
        <GlassCard style={workoutStyles.finishedStatCard}>
          <Text style={workoutStyles.finishedStatValue}>{visibleWorkout.length}</Text>
          <Text style={workoutStyles.finishedStatLabel}>Exercises</Text>
        </GlassCard>
        <GlassCard style={workoutStyles.finishedStatCard}>
          <Text style={workoutStyles.finishedStatValue}>{calculateTotalVolume().toLocaleString()}</Text>
          <Text style={workoutStyles.finishedStatLabel}>Vol. Load (LB)</Text>
        </GlassCard>
      </View>
      <View style={workoutStyles.finishedActions}>
        <NeonButton onPress={onStartNewSession} style={workoutStyles.finishedButton}>
          <PlusCircle size={18} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>INITIATE NEW SESSION</Text>
        </NeonButton>
        <TouchableOpacity onPress={onUndo} style={workoutStyles.finishedUndo}>
          <RotateCcw size={12} color="#64748b" />
          <Text style={workoutStyles.finishedUndoText}>MODIFY LOG DATA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default FinishedSessionView;

