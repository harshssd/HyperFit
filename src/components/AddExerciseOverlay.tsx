import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import NeonButton from './NeonButton';
import workoutStyles from '../styles/workout';

type AddExerciseOverlayProps = {
  visible: boolean;
  newExerciseName: string;
  suggestions: string[];
  onChangeName: (text: string) => void;
  onSubmit: () => void;
  onSelectSuggestion: (text: string) => void;
  onClose: () => void;
};

const AddExerciseOverlay = ({
  visible,
  newExerciseName,
  suggestions,
  onChangeName,
  onSubmit,
  onSelectSuggestion,
  onClose,
}: AddExerciseOverlayProps) => {
  if (!visible) return null;

  return (
    <View style={workoutStyles.addExerciseOverlay}>
      <View style={workoutStyles.addExerciseModal}>
        <Text style={workoutStyles.addExerciseTitle}>ADD EXERCISE</Text>
        <View style={workoutStyles.addExerciseInputContainer}>
          <TextInput
            autoFocus
            style={workoutStyles.addExerciseInput}
            placeholder="Search..."
            placeholderTextColor="#64748b"
            value={newExerciseName}
            onChangeText={onChangeName}
            onSubmitEditing={onSubmit}
          />
          {suggestions.length > 0 && (
            <View style={workoutStyles.suggestionsContainer}>
              {suggestions.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onSelectSuggestion(s)}
                  style={workoutStyles.suggestionItem}
                >
                  <Text style={workoutStyles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={workoutStyles.addExerciseActions}>
          <NeonButton onPress={onSubmit} style={workoutStyles.addExerciseButton}>
            <Text>ADD</Text>
          </NeonButton>
          <TouchableOpacity onPress={onClose} style={workoutStyles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AddExerciseOverlay;

