import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Search,
  Heart,
  Folder,
  FolderPlus,
  Tag,
  User,
  Copy,
  Share2,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import GlassCard from './GlassCard';
import workoutStyles from '../styles/workout';

type FolderType = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
};

type TemplateType = {
  id: string;
  name: string;
  description?: string;
  exercises?: any[];
  folder_id?: string | null;
  icon?: string;
  tags?: string[];
  user_id?: string;
  is_standard?: boolean;
  created_by_username?: string;
};

type TemplatePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  templateSearchQuery: string;
  onChangeSearch: (value: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  selectedFolder: string | null | undefined;
  onToggleFolderFilter: () => void;
  onSelectFolder: (folderId: string | null) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  folders: FolderType[];
  onNewFolder: () => void;
  allTags: string[];
  loading: boolean;
  templates: TemplateType[];
  favorites: Set<string>;
  userId?: string;
  onApplyTemplate: (template: TemplateType) => void;
  onToggleFavorite: (templateId: string) => void;
  onEditTemplate: (template: TemplateType) => void;
  onDeleteTemplate: (templateId: string) => void;
  onDuplicateTemplate: (template: TemplateType) => void;
  onShareTemplate: (template: TemplateType) => void;
};

const TemplatePickerModal = ({
  visible,
  onClose,
  templateSearchQuery,
  onChangeSearch,
  showFavoritesOnly,
  onToggleFavorites,
  selectedFolder,
  onToggleFolderFilter,
  onSelectFolder,
  selectedTags,
  onToggleTag,
  onClearTags,
  folders,
  onNewFolder,
  allTags,
  loading,
  templates,
  favorites,
  userId,
  onApplyTemplate,
  onToggleFavorite,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onShareTemplate,
}: TemplatePickerModalProps) => {
  return (
    <Modal
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={workoutStyles.templateModalSafeArea}>
        <View style={workoutStyles.templatePickerOverlay}>
          <View style={workoutStyles.templatePicker}>
            <View style={workoutStyles.templatePickerHeader}>
              <View>
                <Text style={workoutStyles.templatePickerTitle}>WORKOUT TEMPLATES</Text>
                <Text style={workoutStyles.templatePickerSubtitle}>
                  {templates.length} {templates.length === 1 ? 'TEMPLATE' : 'TEMPLATES'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={workoutStyles.templatePickerClose}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={workoutStyles.templateSearchContainer}>
              <Search size={20} color="#64748b" />
              <TextInput
                style={workoutStyles.templateSearchInput}
                placeholder="Search templates..."
                placeholderTextColor="#64748b"
                value={templateSearchQuery}
                onChangeText={onChangeSearch}
              />
              {templateSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onChangeSearch('')}>
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Bar */}
            <View style={workoutStyles.templateFilterBar}>
              <TouchableOpacity
                onPress={onToggleFavorites}
                style={[workoutStyles.templateFilterButton, showFavoritesOnly && workoutStyles.templateFilterButtonActive]}
              >
                <Heart size={16} color={showFavoritesOnly ? "#f97316" : "#64748b"} fill={showFavoritesOnly ? "#f97316" : "none"} />
                <Text style={[workoutStyles.templateFilterText, showFavoritesOnly && workoutStyles.templateFilterTextActive]}>
                  FAVORITES
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onToggleFolderFilter}
                style={[workoutStyles.templateFilterButton, selectedFolder !== undefined && workoutStyles.templateFilterButtonActive]}
              >
                <Folder size={16} color={selectedFolder !== undefined ? "#f97316" : "#64748b"} />
                <Text style={[workoutStyles.templateFilterText, selectedFolder !== undefined && workoutStyles.templateFilterTextActive]}>
                  FOLDERS
                </Text>
              </TouchableOpacity>

              {selectedTags.length > 0 && (
                <TouchableOpacity
                  onPress={onClearTags}
                  style={workoutStyles.templateFilterButton}
                >
                  <Tag size={16} color="#f97316" />
                  <Text style={workoutStyles.templateFilterTextActive}>
                    {selectedTags.length} TAG{selectedTags.length > 1 ? 'S' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Folder Selector */}
            {selectedFolder !== undefined && (
              <ScrollView horizontal style={workoutStyles.templateFolderSelector} showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => onSelectFolder(null)}
                  style={[workoutStyles.templateFolderChip, selectedFolder === null && workoutStyles.templateFolderChipActive]}
                >
                  <Text style={[workoutStyles.templateFolderChipText, selectedFolder === null && workoutStyles.templateFolderChipTextActive]}>
                    NO FOLDER
                  </Text>
                </TouchableOpacity>
                {folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    onPress={() => onSelectFolder(folder.id)}
                    style={[workoutStyles.templateFolderChip, selectedFolder === folder.id && workoutStyles.templateFolderChipActive]}
                  >
                    <Text style={workoutStyles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                    <Text style={[workoutStyles.templateFolderChipText, selectedFolder === folder.id && workoutStyles.templateFolderChipTextActive]}>
                      {folder.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={onNewFolder}
                  style={[workoutStyles.templateFolderChip, workoutStyles.templateFolderChipNew]}
                >
                  <FolderPlus size={16} color="#f97316" />
                  <Text style={[workoutStyles.templateFolderChipText, { color: '#f97316' }]}>NEW</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Tags Selector */}
            {allTags.length > 0 && (
              <ScrollView horizontal style={workoutStyles.templateTagsSelector} showsHorizontalScrollIndicator={false}>
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => onToggleTag(tag)}
                      style={[workoutStyles.templateTagChip, isSelected && workoutStyles.templateTagChipActive]}
                    >
                      <Tag size={12} color={isSelected ? "#0f172a" : "#64748b"} />
                      <Text style={[workoutStyles.templateTagChipText, isSelected && workoutStyles.templateTagChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Template List */}
            <ScrollView
              style={workoutStyles.templatePickerList}
              contentContainerStyle={workoutStyles.templatePickerListContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={workoutStyles.templateLoadingContainer}>
                  <ActivityIndicator size="large" color="#f97316" />
                  <Text style={workoutStyles.templateLoadingText}>LOADING TEMPLATES...</Text>
                </View>
              ) : templates.length === 0 ? (
                <View style={workoutStyles.templateEmptyContainer}>
                  <Text style={workoutStyles.templateEmptyText}>NO TEMPLATES FOUND</Text>
                  <Text style={workoutStyles.templateEmptySubtext}>Try adjusting your filters</Text>
                </View>
              ) : (
                templates.map((template) => {
                  const isFavorite = favorites.has(template.id);
                  const folder = folders.find((f) => f.id === template.folder_id);
                  const isUserTemplate = template.user_id === userId;
                  const isStandard = template.is_standard;

                  return (
                    <GlassCard key={template.id} style={workoutStyles.templateCard}>
                      <TouchableOpacity
                        onPress={() => onApplyTemplate(template)}
                        style={workoutStyles.templateCardContent}
                      >
                        <Text style={workoutStyles.templateIcon}>{template.icon || '💪'}</Text>
                        <View style={workoutStyles.templateInfo}>
                          <View style={workoutStyles.templateHeaderRow}>
                            <Text style={workoutStyles.templateName}>{template.name}</Text>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(template.id);
                              }}
                              style={workoutStyles.templateFavoriteButton}
                            >
                              <Heart
                                size={18}
                                color={isFavorite ? "#f97316" : "#64748b"}
                                fill={isFavorite ? "#f97316" : "none"}
                              />
                            </TouchableOpacity>
                          </View>
                          <Text style={workoutStyles.templateDescription}>
                            {template.description || `${template.exercises?.length || 0} Exercises`}
                          </Text>
                          <View style={workoutStyles.templateMetaRow}>
                            {isStandard && (
                              <View style={workoutStyles.templateBadge}>
                                <Text style={workoutStyles.templateBadgeText}>STANDARD</Text>
                              </View>
                            )}
                            {!isStandard && template.created_by_username && (
                              <View style={workoutStyles.templateBadge}>
                                <User size={10} color="#64748b" />
                                <Text style={workoutStyles.templateBadgeText}>{template.created_by_username}</Text>
                              </View>
                            )}
                            {folder && (
                              <View style={[workoutStyles.templateBadge, { backgroundColor: folder.color ? folder.color + '20' : '#1e293b' }]}>
                                <Text style={workoutStyles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                                <Text style={[workoutStyles.templateBadgeText, { color: folder.color || '#64748b' }]}>{folder.name}</Text>
                              </View>
                            )}
                            {template.tags && template.tags.length > 0 && (
                              <View style={workoutStyles.templateTagsRow}>
                                {template.tags.slice(0, 2).map((tag, idx) => (
                                  <View key={idx} style={workoutStyles.templateTagBadge}>
                                    <Tag size={8} color="#64748b" />
                                    <Text style={workoutStyles.templateTagBadgeText}>{tag}</Text>
                                  </View>
                                ))}
                                {template.tags.length > 2 && (
                                  <Text style={workoutStyles.templateTagMore}>+{template.tags.length - 2}</Text>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      <View style={workoutStyles.templateActions}>
                        {isUserTemplate && (
                          <>
                            <TouchableOpacity
                              onPress={() => onEditTemplate(template)}
                              style={workoutStyles.templateActionButton}
                            >
                              <Edit3 size={16} color="#22d3ee" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => onDeleteTemplate(template.id)}
                              style={workoutStyles.templateActionButton}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </>
                        )}
                        {!isStandard && (
                          <TouchableOpacity
                            onPress={() => onDuplicateTemplate(template)}
                            style={workoutStyles.templateActionButton}
                          >
                            <Copy size={16} color="#f97316" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => onShareTemplate(template)}
                          style={workoutStyles.templateActionButton}
                        >
                          <Share2 size={16} color="#22d3ee" />
                        </TouchableOpacity>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default TemplatePickerModal;

