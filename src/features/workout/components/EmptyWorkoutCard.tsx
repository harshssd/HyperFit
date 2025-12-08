import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Dumbbell, Layout, PlusCircle } from 'lucide-react-native';
import NeonButton from '../../../components/NeonButton';
import workoutStyles from '../../../styles/workout';

type EmptyWorkoutCardProps = {
  onLoadTemplate: () => void;
  onCustomInput: () => void;
};

const EmptyWorkoutCard = ({ onLoadTemplate, onCustomInput }: EmptyWorkoutCardProps) => {
  return (
    <View style={workoutStyles.emptyWorkout}>
      <View style={workoutStyles.emptyWorkoutIcon}>
        <Dumbbell size={48} color="#475569" />
      </View>
      <Text style={workoutStyles.emptyWorkoutTitle}>SYSTEM IDLE</Text>
      <Text style={workoutStyles.emptyWorkoutSubtitle}>INITIALIZE TRAINING PROTOCOL</Text>
      <View style={workoutStyles.emptyWorkoutActions}>
        <NeonButton onPress={onLoadTemplate} style={workoutStyles.emptyWorkoutButton}>
          <Layout size={24} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>LOAD TEMPLATE</Text>
        </NeonButton>
        <TouchableOpacity
          onPress={onCustomInput}
          style={workoutStyles.emptyWorkoutCustom}
        >
          <PlusCircle size={20} color="#64748b" />
          <Text style={workoutStyles.emptyWorkoutCustomText}>CUSTOM INPUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmptyWorkoutCard;

