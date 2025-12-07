import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { FolderPlus, X } from 'lucide-react-native';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';

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
    <View style={styles.addExerciseOverlay}>
      <View style={styles.addExerciseModal}>
        <View style={styles.saveTemplateHeader}>
          <Text style={styles.addExerciseTitle}>CREATE FOLDER</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.addExerciseCancel}
          >
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.saveTemplateLabel}>FOLDER NAME</Text>
        <TextInput
          style={styles.addExerciseInput}
          placeholder="Enter folder name..."
          placeholderTextColor="#64748b"
          value={newFolderName}
          onChangeText={onChangeFolderName}
          autoFocus
          onSubmitEditing={() => {
            if (trimmed) onCreate();
          }}
        />

        <View style={styles.addExerciseActions}>
          <NeonButton
            onPress={onCreate}
            style={styles.addExerciseButton}
            disabled={!trimmed}
          >
            <FolderPlus size={18} color="#0f172a" />
            <Text style={{ marginLeft: 8 }}>CREATE</Text>
          </NeonButton>
          <TouchableOpacity onPress={onClose} style={styles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CreateFolderModal;

