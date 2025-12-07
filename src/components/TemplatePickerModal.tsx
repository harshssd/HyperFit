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
import styles from '../styles/appStyles';

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
      <SafeAreaView style={styles.templateModalSafeArea}>
        <View style={styles.templatePickerOverlay}>
          <View style={styles.templatePicker}>
            <View style={styles.templatePickerHeader}>
              <View>
                <Text style={styles.templatePickerTitle}>WORKOUT TEMPLATES</Text>
                <Text style={styles.templatePickerSubtitle}>
                  {templates.length} {templates.length === 1 ? 'TEMPLATE' : 'TEMPLATES'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.templatePickerClose}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.templateSearchContainer}>
              <Search size={20} color="#64748b" />
              <TextInput
                style={styles.templateSearchInput}
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
            <View style={styles.templateFilterBar}>
              <TouchableOpacity
                onPress={onToggleFavorites}
                style={[styles.templateFilterButton, showFavoritesOnly && styles.templateFilterButtonActive]}
              >
                <Heart size={16} color={showFavoritesOnly ? "#f97316" : "#64748b"} fill={showFavoritesOnly ? "#f97316" : "none"} />
                <Text style={[styles.templateFilterText, showFavoritesOnly && styles.templateFilterTextActive]}>
                  FAVORITES
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onToggleFolderFilter}
                style={[styles.templateFilterButton, selectedFolder !== undefined && styles.templateFilterButtonActive]}
              >
                <Folder size={16} color={selectedFolder !== undefined ? "#f97316" : "#64748b"} />
                <Text style={[styles.templateFilterText, selectedFolder !== undefined && styles.templateFilterTextActive]}>
                  FOLDERS
                </Text>
              </TouchableOpacity>

              {selectedTags.length > 0 && (
                <TouchableOpacity
                  onPress={onClearTags}
                  style={styles.templateFilterButton}
                >
                  <Tag size={16} color="#f97316" />
                  <Text style={styles.templateFilterTextActive}>
                    {selectedTags.length} TAG{selectedTags.length > 1 ? 'S' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Folder Selector */}
            {selectedFolder !== undefined && (
              <ScrollView horizontal style={styles.templateFolderSelector} showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => onSelectFolder(null)}
                  style={[styles.templateFolderChip, selectedFolder === null && styles.templateFolderChipActive]}
                >
                  <Text style={[styles.templateFolderChipText, selectedFolder === null && styles.templateFolderChipTextActive]}>
                    NO FOLDER
                  </Text>
                </TouchableOpacity>
                {folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    onPress={() => onSelectFolder(folder.id)}
                    style={[styles.templateFolderChip, selectedFolder === folder.id && styles.templateFolderChipActive]}
                  >
                    <Text style={styles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                    <Text style={[styles.templateFolderChipText, selectedFolder === folder.id && styles.templateFolderChipTextActive]}>
                      {folder.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={onNewFolder}
                  style={[styles.templateFolderChip, styles.templateFolderChipNew]}
                >
                  <FolderPlus size={16} color="#f97316" />
                  <Text style={[styles.templateFolderChipText, { color: '#f97316' }]}>NEW</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Tags Selector */}
            {allTags.length > 0 && (
              <ScrollView horizontal style={styles.templateTagsSelector} showsHorizontalScrollIndicator={false}>
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => onToggleTag(tag)}
                      style={[styles.templateTagChip, isSelected && styles.templateTagChipActive]}
                    >
                      <Tag size={12} color={isSelected ? "#0f172a" : "#64748b"} />
                      <Text style={[styles.templateTagChipText, isSelected && styles.templateTagChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Template List */}
            <ScrollView
              style={styles.templatePickerList}
              contentContainerStyle={styles.templatePickerListContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.templateLoadingContainer}>
                  <ActivityIndicator size="large" color="#f97316" />
                  <Text style={styles.templateLoadingText}>LOADING TEMPLATES...</Text>
                </View>
              ) : templates.length === 0 ? (
                <View style={styles.templateEmptyContainer}>
                  <Text style={styles.templateEmptyText}>NO TEMPLATES FOUND</Text>
                  <Text style={styles.templateEmptySubtext}>Try adjusting your filters</Text>
                </View>
              ) : (
                templates.map((template) => {
                  const isFavorite = favorites.has(template.id);
                  const folder = folders.find((f) => f.id === template.folder_id);
                  const isUserTemplate = template.user_id === userId;
                  const isStandard = template.is_standard;

                  return (
                    <GlassCard key={template.id} style={styles.templateCard}>
                      <TouchableOpacity
                        onPress={() => onApplyTemplate(template)}
                        style={styles.templateCardContent}
                      >
                        <Text style={styles.templateIcon}>{template.icon || '💪'}</Text>
                        <View style={styles.templateInfo}>
                          <View style={styles.templateHeaderRow}>
                            <Text style={styles.templateName}>{template.name}</Text>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(template.id);
                              }}
                              style={styles.templateFavoriteButton}
                            >
                              <Heart
                                size={18}
                                color={isFavorite ? "#f97316" : "#64748b"}
                                fill={isFavorite ? "#f97316" : "none"}
                              />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.templateDescription}>
                            {template.description || `${template.exercises?.length || 0} Exercises`}
                          </Text>
                          <View style={styles.templateMetaRow}>
                            {isStandard && (
                              <View style={styles.templateBadge}>
                                <Text style={styles.templateBadgeText}>STANDARD</Text>
                              </View>
                            )}
                            {!isStandard && template.created_by_username && (
                              <View style={styles.templateBadge}>
                                <User size={10} color="#64748b" />
                                <Text style={styles.templateBadgeText}>{template.created_by_username}</Text>
                              </View>
                            )}
                            {folder && (
                              <View style={[styles.templateBadge, { backgroundColor: folder.color ? folder.color + '20' : '#1e293b' }]}>
                                <Text style={styles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                                <Text style={[styles.templateBadgeText, { color: folder.color || '#64748b' }]}>{folder.name}</Text>
                              </View>
                            )}
                            {template.tags && template.tags.length > 0 && (
                              <View style={styles.templateTagsRow}>
                                {template.tags.slice(0, 2).map((tag, idx) => (
                                  <View key={idx} style={styles.templateTagBadge}>
                                    <Tag size={8} color="#64748b" />
                                    <Text style={styles.templateTagBadgeText}>{tag}</Text>
                                  </View>
                                ))}
                                {template.tags.length > 2 && (
                                  <Text style={styles.templateTagMore}>+{template.tags.length - 2}</Text>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.templateActions}>
                        {isUserTemplate && (
                          <>
                            <TouchableOpacity
                              onPress={() => onEditTemplate(template)}
                              style={styles.templateActionButton}
                            >
                              <Edit3 size={16} color="#22d3ee" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => onDeleteTemplate(template.id)}
                              style={styles.templateActionButton}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </>
                        )}
                        {!isStandard && (
                          <TouchableOpacity
                            onPress={() => onDuplicateTemplate(template)}
                            style={styles.templateActionButton}
                          >
                            <Copy size={16} color="#f97316" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => onShareTemplate(template)}
                          style={styles.templateActionButton}
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

