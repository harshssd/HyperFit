import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Share2, X } from 'lucide-react-native';
import { palette, text, spacing } from '../../styles/theme';
import {
  ShareableSummaryCard,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  type SharePayload,
} from './ShareableSummaryCard';
import { useShareCard } from './useShareCard';

const PREVIEW_SCALE = 0.3;
const PREVIEW_W = SHARE_CARD_WIDTH * PREVIEW_SCALE;
const PREVIEW_H = SHARE_CARD_HEIGHT * PREVIEW_SCALE;

type Props = {
  visible: boolean;
  payload: SharePayload | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
};

/**
 * Bottom-sheet preview of a `ShareableSummaryCard` before the system share
 * dialog opens. Renders the actual card scaled to ~30% so the user sees
 * exactly what will be exported, plus an editable title field — picked up
 * for both the visible preview and the off-screen capture target.
 */
export const SharePreviewSheet = ({ visible, payload, loading, error, onClose }: Props) => {
  const { ref, share, state } = useShareCard();
  const [title, setTitle] = useState<string>('');

  // Re-seed the editable title whenever the sheet opens for a new payload.
  // Keeps user edits within a single open session, but doesn't preserve
  // them across opens — the next workout/plan starts from its own default.
  useEffect(() => {
    if (visible && payload) setTitle(payload.title);
  }, [visible, payload?.kind, payload?.title]);

  const isPlan = payload?.kind === 'plan';
  const trimmed = title.trim();
  const effectivePayload = payload
    ? { ...payload, title: trimmed || payload.title }
    : null;
  const shareDisabled =
    !effectivePayload || !!loading || !!error || state === 'capturing' || state === 'sharing';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isPlan ? 'SHARE PLAN' : 'SHARE WORKOUT'}</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <X size={22} color={text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isPlan ? 'WORKOUT PLAN' : 'WORKOUT'}
            placeholderTextColor={text.quaternary}
            style={styles.input}
            maxLength={48}
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel="Share title"
          />

          <Text style={styles.fieldLabel}>PREVIEW</Text>
          {loading ? (
            <View style={styles.statusBlock}>
              <ActivityIndicator color={palette.liftActive} />
              <Text style={styles.statusText}>Computing coverage…</Text>
            </View>
          ) : error ? (
            <View style={styles.statusBlock}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : effectivePayload ? (
            <View style={styles.previewWrap}>
              <View style={styles.previewClip}>
                <View style={styles.previewScale}>
                  <ShareableSummaryCard payload={effectivePayload} />
                </View>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={share}
            disabled={shareDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: shareDisabled }}
            style={[styles.shareButton, shareDisabled && styles.shareButtonDisabled]}
          >
            {state === 'capturing' || state === 'sharing' ? (
              <ActivityIndicator size="small" color={palette.liftActive} />
            ) : (
              <Share2 size={16} color={palette.liftActive} />
            )}
            <Text style={styles.shareLabel}>
              {state === 'capturing'
                ? 'CAPTURING…'
                : state === 'sharing'
                  ? 'SHARING…'
                  : isPlan
                    ? 'SHARE PLAN'
                    : 'SHARE WORKOUT'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Off-screen capture target. Renders the same edited payload at the
            full 1080×1350 export size so captureRef writes the high-res image
            (the visible preview is just scaled CSS, not the captured view). */}
        <View pointerEvents="none" style={styles.captureHost}>
          {effectivePayload && <ShareableSummaryCard ref={ref} payload={effectivePayload} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SharePreviewSheet;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  headerTitle: {
    color: text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    fontFamily: 'monospace',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldLabel: {
    color: text.quaternary,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  input: {
    color: text.primary,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
  },
  previewWrap: {
    alignItems: 'center',
  },
  previewClip: {
    width: PREVIEW_W,
    height: PREVIEW_H,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  previewScale: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    transform: [{ scale: PREVIEW_SCALE }],
    transformOrigin: 'top left',
  },
  statusBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  statusText: { color: text.tertiary, fontSize: 13 },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.liftActive,
    borderRadius: 8,
    marginTop: spacing.md,
    backgroundColor: 'rgba(252, 76, 2, 0.08)',
  },
  shareButtonDisabled: { opacity: 0.5 },
  shareLabel: {
    color: palette.liftActive,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  captureHost: {
    position: 'absolute',
    left: -10000,
    top: -10000,
  },
});
