import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Medal, RotateCcw, PlusCircle } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import styles from '../../../styles/appStyles';

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
    <ScrollView contentContainerStyle={styles.finishedContainer}>
      <View style={styles.finishedIcon}>
        <Medal size={48} color="#22d3ee" />
      </View>
      <View style={styles.finishedText}>
        <Text style={styles.finishedTitle}>SESSION COMPLETE</Text>
        <Text style={styles.finishedSubtitle}>DATA UPLOADED SUCCESSFULLY</Text>
      </View>
      <View style={styles.finishedStats}>
        <GlassCard style={styles.finishedStatCard}>
          <Text style={styles.finishedStatValue}>{visibleWorkout.length}</Text>
          <Text style={styles.finishedStatLabel}>Exercises</Text>
        </GlassCard>
        <GlassCard style={styles.finishedStatCard}>
          <Text style={styles.finishedStatValue}>{calculateTotalVolume().toLocaleString()}</Text>
          <Text style={styles.finishedStatLabel}>Vol. Load (LB)</Text>
        </GlassCard>
      </View>
      <View style={styles.finishedActions}>
        <NeonButton onPress={onStartNewSession} style={styles.finishedButton}>
          <PlusCircle size={18} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>INITIATE NEW SESSION</Text>
        </NeonButton>
        <TouchableOpacity onPress={onUndo} style={styles.finishedUndo}>
          <RotateCcw size={12} color="#64748b" />
          <Text style={styles.finishedUndoText}>MODIFY LOG DATA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default FinishedSessionView;

