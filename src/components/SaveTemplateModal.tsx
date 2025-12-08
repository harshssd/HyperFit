import React, { RefObject } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Save, X } from 'lucide-react-native';
import NeonButton from './NeonButton';
import workoutStyles from '../styles/workout';

type SaveTemplateModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  templateName: string;
  onChangeTemplateName: (value: string) => void;
  saveTemplateFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  folders: Array<{ id: string; name: string; icon?: string }>;
  saveTemplateTags: string[];
  onChangeTags: (tags: string[]) => void;
  saveTemplateTagInputRef: RefObject<TextInput | null>;
  exerciseCount: number;
};

const SaveTemplateModal = ({
  visible,
  onClose,
  onSave,
  templateName,
  onChangeTemplateName,
  saveTemplateFolder,
  onSelectFolder,
  folders,
  saveTemplateTags,
  onChangeTags,
  saveTemplateTagInputRef,
  exerciseCount,
}: SaveTemplateModalProps) => {
  if (!visible) return null;

  return (
    <View style={workoutStyles.addExerciseOverlay}>
      <View style={workoutStyles.addExerciseModal}>
        <View style={workoutStyles.saveTemplateHeader}>
          <Text style={workoutStyles.addExerciseTitle}>SAVE TEMPLATE</Text>
          <TouchableOpacity onPress={onClose} style={workoutStyles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        <Text style={workoutStyles.saveTemplateSubtitle}>{exerciseCount} Exercises</Text>

        <Text style={workoutStyles.saveTemplateLabel}>TEMPLATE NAME</Text>
        <TextInput
          style={workoutStyles.addExerciseInput}
          placeholder="Enter template name..."
          placeholderTextColor="#64748b"
          value={templateName}
          onChangeText={onChangeTemplateName}
          autoFocus
        />

        <Text style={[workoutStyles.saveTemplateLabel, { marginTop: 16 }]}>FOLDER (OPTIONAL)</Text>
        <ScrollView horizontal style={workoutStyles.saveTemplateFolderSelector} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => onSelectFolder(null)}
            style={[workoutStyles.templateFolderChip, !saveTemplateFolder && workoutStyles.templateFolderChipActive]}
          >
            <Text style={[workoutStyles.templateFolderChipText, !saveTemplateFolder && workoutStyles.templateFolderChipTextActive]}>
              NO FOLDER
            </Text>
          </TouchableOpacity>
          {folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              onPress={() => onSelectFolder(folder.id)}
              style={[workoutStyles.templateFolderChip, saveTemplateFolder === folder.id && workoutStyles.templateFolderChipActive]}
            >
              <Text style={workoutStyles.templateFolderIcon}>{folder.icon || '📁'}</Text>
              <Text style={[workoutStyles.templateFolderChipText, saveTemplateFolder === folder.id && workoutStyles.templateFolderChipTextActive]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[workoutStyles.saveTemplateLabel, { marginTop: 16 }]}>TAGS (OPTIONAL)</Text>
        <View style={workoutStyles.saveTemplateTagsContainer}>
          <ScrollView
            horizontal
            style={workoutStyles.saveTemplateTagsInput}
            contentContainerStyle={workoutStyles.saveTemplateTagsInputContent}
            showsHorizontalScrollIndicator={false}
          >
            {saveTemplateTags.map((tag, idx) => (
              <View key={idx} style={workoutStyles.saveTemplateTag}>
                <Text style={workoutStyles.saveTemplateTagText}>{tag}</Text>
                <TouchableOpacity onPress={() => onChangeTags(saveTemplateTags.filter((_, i) => i !== idx))}>
                  <X size={12} color="#64748b" />
                </TouchableOpacity>
              </View>
            ))}
            <TextInput
              ref={saveTemplateTagInputRef}
              style={workoutStyles.saveTemplateTagInput}
              placeholder="Add tag..."
              placeholderTextColor="#64748b"
              onSubmitEditing={(e) => {
                const tag = e.nativeEvent.text.trim();
                if (tag && !saveTemplateTags.includes(tag)) {
                  onChangeTags([...saveTemplateTags, tag]);
                }
                saveTemplateTagInputRef.current?.clear();
              }}
            />
          </ScrollView>
        </View>

        <View style={workoutStyles.addExerciseActions}>
          <NeonButton onPress={onSave} style={workoutStyles.addExerciseButton} disabled={!templateName.trim()}>
            <Save size={18} color="#0f172a" />
            <Text style={{ marginLeft: 8 }}>SAVE</Text>
          </NeonButton>
          <TouchableOpacity onPress={onClose} style={workoutStyles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SaveTemplateModal;

