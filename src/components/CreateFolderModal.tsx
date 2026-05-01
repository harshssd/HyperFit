import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { FolderPlus, X } from 'lucide-react-native';
import NeonButton from './NeonButton';
import { workoutStyles, modalStyles } from '../styles';
import { palette, text } from '../styles/theme';

type CreateFolderModalProps = {
  visible: boolean;
  newFolderName: string;
  onChangeFolderName: (name: string) => void;
  onCreate: () => void;
  onClose: () => void;
};

const CreateFolderModal = ({
  visible,
  newFolderName,
  onChangeFolderName,
  onCreate,
  onClose,
}: CreateFolderModalProps) => {
  if (!visible) return null;

  const trimmed = newFolderName.trim();

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.card, { maxWidth: 400, width: '100%' }]}>
        <View style={modalStyles.headerRow}>
          <Text style={workoutStyles.addExerciseTitle}>CREATE FOLDER</Text>
          <TouchableOpacity
            onPress={onClose}
            style={workoutStyles.addExerciseCancel}
          >
            <X size={24} color={text.tertiary} />
          </TouchableOpacity>
        </View>

        <Text style={workoutStyles.saveTemplateLabel}>FOLDER NAME</Text>
        <TextInput
          style={workoutStyles.addExerciseInput}
          placeholder="Enter folder name..."
          placeholderTextColor={text.disabled}
          value={newFolderName}
          onChangeText={onChangeFolderName}
          autoFocus
          onSubmitEditing={() => {
            if (trimmed) onCreate();
          }}
        />

        <View style={workoutStyles.addExerciseActions}>
          <NeonButton
            onPress={onCreate}
            style={workoutStyles.addExerciseButton}
            disabled={!trimmed}
          >
            <FolderPlus size={18} color={palette.bg} />
            <Text style={{ marginLeft: 8 }}>CREATE</Text>
          </NeonButton>
          <TouchableOpacity onPress={onClose} style={workoutStyles.addExerciseCancel}>
            <X size={24} color={text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CreateFolderModal;

