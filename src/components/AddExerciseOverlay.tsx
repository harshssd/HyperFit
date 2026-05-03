import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { X, Search, Plus, Check } from 'lucide-react-native';
import { palette, text, accent, spacing, radii } from '../styles/theme';

type AddExerciseOverlayProps = {
  visible: boolean;
  newExerciseName: string;
  suggestions: string[];
  /** Exercises already in the current session — used to mark rows as ADDED
   *  and disable re-tap so rapid taps can't stack duplicates. */
  alreadyAdded?: string[];
  onChangeName: (text: string) => void;
  onSubmit: () => void;
  onSelectSuggestion: (text: string) => void;
  onClose: () => void;
};

/**
 * Add Exercise modal — pageSheet presentation so iOS lifts the input above the
 * keyboard automatically. Search input on top, scrollable suggestion list, and
 * a "+ Add 'X' as new exercise" footer row when the typed query has no exact
 * match in the suggestions (free-text fallback as a last resort).
 */
const AddExerciseOverlay = ({
  visible,
  newExerciseName,
  suggestions,
  alreadyAdded = [],
  onChangeName,
  onSubmit,
  onSelectSuggestion,
  onClose,
}: AddExerciseOverlayProps) => {
  const trimmed = newExerciseName.trim();
  const exactMatch = useMemo(
    () => suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase()),
    [suggestions, trimmed],
  );
  const addedSet = useMemo(
    () => new Set(alreadyAdded.map((n) => n.toLowerCase())),
    [alreadyAdded],
  );
  // Block free-text duplicates too — typing a name that's already in the
  // session shouldn't add another row just because it isn't an exact case
  // match in suggestions.
  const isFreeTextDuplicate =
    trimmed.length > 0 && addedSet.has(trimmed.toLowerCase());
  const showFreeTextFallback =
    trimmed.length > 0 && !exactMatch && !isFreeTextDuplicate;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: palette.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header — title + close. X is the only way out, so keep it big. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderSubtle,
          }}
        >
          <View style={{ width: 24 }} />
          <Text
            style={{
              color: text.primary,
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.6,
            }}
          >
            ADD EXERCISE
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <X size={24} color={text.primary} />
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.borderSubtle,
              borderRadius: radii.sm,
              paddingHorizontal: spacing.md,
            }}
          >
            <Search size={16} color={text.quaternary} />
            <TextInput
              autoFocus
              placeholder="Search exercises…"
              placeholderTextColor={text.quaternary}
              value={newExerciseName}
              onChangeText={onChangeName}
              onSubmitEditing={onSubmit}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="words"
              style={{
                flex: 1,
                color: text.primary,
                fontSize: 15,
                paddingVertical: spacing.md,
              }}
            />
          </View>
        </View>

        {/* Suggestion list — scrollable so long lists work. Tap a row to add
            that exercise immediately (matches SlimPlanCreator's tap-to-pick
            pattern; users don't have to commit via a separate ADD button). */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((s, idx) => {
            const isAdded = addedSet.has(s.toLowerCase());
            return (
              <TouchableOpacity
                key={`${s}-${idx}`}
                disabled={isAdded}
                onPress={() => onSelectSuggestion(s)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  borderWidth: 1,
                  borderColor: isAdded ? accent.lift : palette.borderSubtle,
                  backgroundColor: isAdded ? 'rgba(252, 76, 2, 0.08)' : 'transparent',
                  borderRadius: radii.sm,
                  marginBottom: spacing.sm,
                  opacity: isAdded ? 0.7 : 1,
                }}
              >
                <Text style={{ color: text.primary, fontSize: 15, flex: 1 }}>{s}</Text>
                {isAdded ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Check size={14} color={accent.lift} />
                    <Text style={{ color: accent.lift, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>
                      ADDED
                    </Text>
                  </View>
                ) : (
                  <Plus size={14} color={text.tertiary} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Free-text fallback. Only when the query is non-empty and isn't
              already in the suggestions, so we never duplicate an existing
              exercise via the "add as new" path. */}
          {showFreeTextFallback && (
            <TouchableOpacity
              testID="add-exercise-free-text"
              onPress={onSubmit}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderWidth: 1,
                borderColor: accent.lift,
                borderRadius: radii.sm,
                backgroundColor: 'rgba(252, 76, 2, 0.08)',
                marginTop: suggestions.length > 0 ? spacing.md : 0,
              }}
            >
              <Plus size={16} color={accent.lift} />
              <Text style={{ color: accent.lift, fontSize: 14, fontWeight: '700' }}>
                Add "{trimmed}" as new exercise
              </Text>
            </TouchableOpacity>
          )}

          {/* Empty hint when user hasn't typed anything yet. */}
          {trimmed.length === 0 && suggestions.length === 0 && (
            <Text
              style={{
                color: text.quaternary,
                fontSize: 13,
                textAlign: 'center',
                marginTop: spacing.xl,
              }}
            >
              Start typing to search the exercise library.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddExerciseOverlay;
