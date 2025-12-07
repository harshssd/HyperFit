import React, { RefObject } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Save, X } from 'lucide-react-native';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';

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
    <View style={styles.addExerciseOverlay}>
      <View style={styles.addExerciseModal}>
        <View style={styles.saveTemplateHeader}>
          <Text style={styles.addExerciseTitle}>SAVE TEMPLATE</Text>
          <TouchableOpacity onPress={onClose} style={styles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        <Text style={styles.saveTemplateSubtitle}>{exerciseCount} Exercises</Text>

        <Text style={styles.saveTemplateLabel}>TEMPLATE NAME</Text>
        <TextInput
          style={styles.addExerciseInput}
          placeholder="Enter template name..."
          placeholderTextColor="#64748b"
          value={templateName}
          onChangeText={onChangeTemplateName}
          autoFocus
        />

        <Text style={[styles.saveTemplateLabel, { marginTop: 16 }]}>FOLDER (OPTIONAL)</Text>
        <ScrollView horizontal style={styles.saveTemplateFolderSelector} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => onSelectFolder(null)}
            style={[styles.templateFolderChip, !saveTemplateFolder && styles.templateFolderChipActive]}
          >
            <Text style={[styles.templateFolderChipText, !saveTemplateFolder && styles.templateFolderChipTextActive]}>
              NO FOLDER
            </Text>
          </TouchableOpacity>
          {folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              onPress={() => onSelectFolder(folder.id)}
              style={[styles.templateFolderChip, saveTemplateFolder === folder.id && styles.templateFolderChipActive]}
            >
              <Text style={styles.templateFolderIcon}>{folder.icon || '📁'}</Text>
              <Text style={[styles.templateFolderChipText, saveTemplateFolder === folder.id && styles.templateFolderChipTextActive]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.saveTemplateLabel, { marginTop: 16 }]}>TAGS (OPTIONAL)</Text>
        <View style={styles.saveTemplateTagsContainer}>
          <ScrollView
            horizontal
            style={styles.saveTemplateTagsInput}
            contentContainerStyle={styles.saveTemplateTagsInputContent}
            showsHorizontalScrollIndicator={false}
          >
            {saveTemplateTags.map((tag, idx) => (
              <View key={idx} style={styles.saveTemplateTag}>
                <Text style={styles.saveTemplateTagText}>{tag}</Text>
                <TouchableOpacity onPress={() => onChangeTags(saveTemplateTags.filter((_, i) => i !== idx))}>
                  <X size={12} color="#64748b" />
                </TouchableOpacity>
              </View>
            ))}
            <TextInput
              ref={saveTemplateTagInputRef}
              style={styles.saveTemplateTagInput}
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

        <View style={styles.addExerciseActions}>
          <NeonButton onPress={onSave} style={styles.addExerciseButton} disabled={!templateName.trim()}>
            <Save size={18} color="#0f172a" />
            <Text style={{ marginLeft: 8 }}>SAVE</Text>
          </NeonButton>
          <TouchableOpacity onPress={onClose} style={styles.addExerciseCancel}>
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SaveTemplateModal;

