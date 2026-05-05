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
import { X, Search, Plus, Check, ArrowRight } from 'lucide-react-native';
import { palette, text, accent, spacing, radii, fonts } from '../styles/theme';

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
  /**
   * When true, the sticky bottom CTA (after >=1 added) reads "DONE" and only
   * dismisses the overlay — assumed a workout session is already in progress.
   * When false (default), the CTA reads "START WORKOUT (N EXERCISES)" and
   * triggers `onStartWorkout` in addition to dismissing.
   */
  sessionActive?: boolean;
  /** Required when `sessionActive` is false — fired by the START WORKOUT CTA. */
  onStartWorkout?: () => void;
};

/**
 * Add Exercise modal — pageSheet presentation so iOS lifts the input above the
 * keyboard automatically. Search input on top, scrollable suggestion list, and
 * a "+ Add 'X' as new exercise" footer row when the typed query has no exact
 * match in the suggestions (free-text fallback as a last resort).
 *
 * After at least one exercise has been added, a sticky bottom CTA appears so
 * the user can leave the modal AND start the workout in one tap (or just
 * dismiss when the session is already underway).
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
  sessionActive = false,
  onStartWorkout,
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

  const addedCount = alreadyAdded.length;
  const showStickyCta = addedCount > 0;
  const ctaLabel = sessionActive
    ? 'DONE'
    : `START WORKOUT (${addedCount} ${addedCount === 1 ? 'EXERCISE' : 'EXERCISES'})`;

  const handleStickyPress = () => {
    if (sessionActive) {
      onClose();
    } else {
      onStartWorkout?.();
      onClose();
    }
  };

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
        {/* Header — 2px orange top accent rule (lift signal) + title + close. */}
        <View style={{ height: 2, backgroundColor: accent.lift }} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <View style={{ width: 24 }} />
          <Text
            style={{
              color: text.primary,
              fontFamily: fonts.family.black,
              fontSize: 12,
              letterSpacing: 1.6,
            }}
          >
            ADD EXERCISE
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <X size={22} color={text.secondary} />
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
              borderColor: palette.borderStrong,
              borderRadius: radii.md,
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
                fontFamily: fonts.family.base,
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
          contentContainerStyle={{
            padding: spacing.lg,
            // Leave room for the sticky CTA so the last row isn't hidden.
            paddingBottom: showStickyCta ? 96 : spacing.xxl,
          }}
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
                  borderColor: isAdded ? accent.lift : palette.borderStrong,
                  backgroundColor: isAdded ? 'rgba(252, 76, 2, 0.08)' : palette.surface,
                  borderRadius: radii.md,
                  marginBottom: spacing.sm,
                }}
              >
                <Text
                  style={{
                    color: isAdded ? text.primary : text.secondary,
                    fontFamily: fonts.family.medium,
                    fontSize: 15,
                    flex: 1,
                  }}
                >
                  {s}
                </Text>
                {isAdded ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: radii.full,
                      backgroundColor: 'rgba(252, 76, 2, 0.14)',
                    }}
                  >
                    <Check size={12} color={accent.lift} />
                    <Text
                      style={{
                        color: accent.lift,
                        fontFamily: fonts.family.black,
                        fontSize: 10,
                        letterSpacing: 1.2,
                      }}
                    >
                      ADDED
                    </Text>
                  </View>
                ) : (
                  <Plus size={16} color={text.tertiary} />
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
                borderRadius: radii.md,
                backgroundColor: 'rgba(252, 76, 2, 0.08)',
                marginTop: suggestions.length > 0 ? spacing.md : 0,
              }}
            >
              <Plus size={16} color={accent.lift} />
              <Text
                style={{
                  color: accent.lift,
                  fontFamily: fonts.family.bold,
                  fontSize: 14,
                }}
              >
                Add "{trimmed}" as new exercise
              </Text>
            </TouchableOpacity>
          )}

          {/* Empty hint when user hasn't typed anything yet. */}
          {trimmed.length === 0 && suggestions.length === 0 && (
            <Text
              style={{
                color: text.quaternary,
                fontFamily: fonts.family.base,
                fontSize: 13,
                textAlign: 'center',
                marginTop: spacing.xl,
              }}
            >
              Start typing to search the exercise library.
            </Text>
          )}
        </ScrollView>

        {/* Sticky bottom CTA. Shown once the user has added >=1 exercise so
            they aren't forced to hunt for the X to leave + start the workout. */}
        {showStickyCta && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
              backgroundColor: palette.bg,
              borderTopWidth: 1,
              borderTopColor: palette.borderStrong,
            }}
          >
            <TouchableOpacity
              testID="add-exercise-sticky-cta"
              onPress={handleStickyPress}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md + 2,
                borderRadius: radii.md,
                backgroundColor: accent.lift,
              }}
            >
              <Text
                style={{
                  color: palette.bg,
                  fontFamily: fonts.family.black,
                  fontSize: 13,
                  letterSpacing: 1.4,
                }}
              >
                {ctaLabel}
              </Text>
              <ArrowRight size={16} color={palette.bg} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddExerciseOverlay;
