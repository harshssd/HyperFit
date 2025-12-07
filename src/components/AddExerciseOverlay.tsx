import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';

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
    <View style={styles.addExerciseOverlay}>
      <View style={styles.addExerciseModal}>
        <Text style={styles.addExerciseTitle}>ADD EXERCISE</Text>
        <View style={styles.addExerciseInputContainer}>
          <TextInput
            autoFocus
            style={styles.addExerciseInput}
            placeholder="Search..."
            placeholderTextColor="#64748b"
            value={newExerciseName}
            onChangeText={onChangeName}
            onSubmitEditing={onSubmit}
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onSelectSuggestion(s)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.addExerciseActions}>
          <NeonButton onPress={onSubmit} style={styles.addExerciseButton}>
            <Text>ADD</Text>
          </NeonButton>
          <TouchableOpacity onPress={onClose} style={styles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AddExerciseOverlay;

