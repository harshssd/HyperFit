import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Dumbbell, Layout, PlusCircle } from 'lucide-react-native';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';

type EmptyWorkoutCardProps = {
  onLoadTemplate: () => void;
  onCustomInput: () => void;
};

const EmptyWorkoutCard = ({ onLoadTemplate, onCustomInput }: EmptyWorkoutCardProps) => {
  return (
    <View style={styles.emptyWorkout}>
      <View style={styles.emptyWorkoutIcon}>
        <Dumbbell size={48} color="#475569" />
      </View>
      <Text style={styles.emptyWorkoutTitle}>SYSTEM IDLE</Text>
      <Text style={styles.emptyWorkoutSubtitle}>INITIALIZE TRAINING PROTOCOL</Text>
      <View style={styles.emptyWorkoutActions}>
        <NeonButton onPress={onLoadTemplate} style={styles.emptyWorkoutButton}>
          <Layout size={24} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>LOAD TEMPLATE</Text>
        </NeonButton>
        <TouchableOpacity
          onPress={onCustomInput}
          style={styles.emptyWorkoutCustom}
        >
          <PlusCircle size={20} color="#64748b" />
          <Text style={styles.emptyWorkoutCustomText}>CUSTOM INPUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmptyWorkoutCard;

