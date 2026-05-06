import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../styles/theme';
import { deleteAccount } from '../services/account';

/**
 * Two-step delete confirmation modal. Standard pattern:
 *   Step 1 — warning + list of what gets wiped + "I understand" button
 *   Step 2 — type DELETE to enable the final destructive action
 *
 * The friction is the point. Apple guideline 5.1.1(v) requires deletion
 * to be reasonably easy to find and reasonably hard to do by accident;
 * this matches what every well-behaved app does (GitHub, 1Password,
 * Linear, etc).
 *
 * On success we hand control back to the parent via onDeleted, which
 * runs supabase.auth.signOut() and lets RootNavigator swap trees.
 * Keeping the sign-out outside this component means it can't double-fire
 * if the modal unmounts mid-flow.
 */

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called after the server confirms deletion. Parent should sign out. */
  onDeleted: () => Promise<void>;
};

const CONFIRM_PHRASE = 'DELETE';

export const DeleteAccountModal = ({ visible, onClose, onDeleted }: Props) => {
  // Step 1 = read the warning. Step 2 = type DELETE. Reset on close.
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setTyped('');
    setBusy(false);
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (busy || typed.trim().toUpperCase() !== CONFIRM_PHRASE) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete account');
      setBusy(false);
      return;
    }
    // Server has wiped the user. Hand off to parent for sign-out.
    // Don't reset modal state — if signOut takes a moment, leaving
    // the modal in its committed (busy) state prevents a flash of
    // step-1 UI before the navigator swaps. If signOut throws (rare
    // network failure), AsyncStorage still gets cleared locally and
    // the auth listener fires anyway, but defensively reset busy so
    // the user isn't stuck with an infinite spinner.
    try {
      await onDeleted();
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof Error
          ? `Account deleted but sign-out failed: ${e.message}. Force-quit and reopen the app.`
          : 'Account deleted but sign-out failed. Force-quit and reopen the app.',
      );
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: palette.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <AlertTriangle size={20} color={accent.regression} strokeWidth={2} />
            <Text
              style={{
                color: text.primary,
                fontSize: 18,
                fontWeight: '900',
                letterSpacing: -0.3,
              }}
            >
              Delete account
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            disabled={busy}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close delete account"
          >
            <X size={22} color={text.tertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xxl,
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <Text style={{ color: text.primary, fontSize: 16, fontWeight: '700', lineHeight: 22 }}>
                This will permanently delete your account and everything you've logged.
              </Text>

              <View
                style={{
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: palette.borderStrong,
                  backgroundColor: palette.surface,
                  padding: spacing.lg,
                  gap: spacing.sm,
                }}
              >
                <Text style={{ color: text.quaternary, fontSize: 11, fontFamily: fonts.family.mono, letterSpacing: 1.6, fontWeight: '800' }}>
                  GETS WIPED
                </Text>
                {[
                  'Every workout session and set',
                  'Your active and saved workout plans',
                  'Custom exercises you created',
                  'All meal entries and water logs',
                  'Daily nutrition goals and history',
                  'Your sign-in identity',
                ].map(item => (
                  <Text key={item} style={{ color: text.secondary, fontSize: 14, lineHeight: 20 }}>
                    · {item}
                  </Text>
                ))}
              </View>

              <Text style={{ color: text.tertiary, fontSize: 13, lineHeight: 18 }}>
                There's no undo. If you want to come back later you'll start fresh — same email, but no past data.
              </Text>

              <TouchableOpacity
                onPress={() => setStep(2)}
                accessibilityRole="button"
                accessibilityLabel="Continue to delete confirmation"
                style={{
                  marginTop: spacing.md,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: accent.regression,
                  backgroundColor: 'rgba(239, 68, 68, 0.10)',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: accent.regression,
                    fontFamily: fonts.family.mono,
                    fontSize: 13,
                    letterSpacing: 2.4,
                    textTransform: 'uppercase',
                    fontWeight: '800',
                  }}
                >
                  I understand · continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={{
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: text.tertiary, fontSize: 14, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ color: text.primary, fontSize: 16, fontWeight: '700', lineHeight: 22 }}>
                Type <Text style={{ color: accent.regression, fontFamily: fonts.family.mono }}>{CONFIRM_PHRASE}</Text> to confirm.
              </Text>

              <TextInput
                value={typed}
                onChangeText={setTyped}
                autoFocus
                autoCorrect={false}
                autoCapitalize="characters"
                placeholder={CONFIRM_PHRASE}
                placeholderTextColor={text.disabled}
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
                editable={!busy}
                style={{
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor:
                    typed.trim().toUpperCase() === CONFIRM_PHRASE
                      ? accent.regression
                      : palette.borderStrong,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.lg,
                  color: text.primary,
                  fontSize: 18,
                  fontFamily: fonts.family.mono,
                  letterSpacing: 2,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              />

              {error ? (
                <Text style={{ color: accent.regression, fontSize: 13, textAlign: 'center' }}>
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={handleConfirm}
                disabled={busy || typed.trim().toUpperCase() !== CONFIRM_PHRASE}
                accessibilityRole="button"
                accessibilityLabel="Delete account permanently"
                style={{
                  marginTop: spacing.md,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  backgroundColor: accent.regression,
                  alignItems: 'center',
                  opacity:
                    busy || typed.trim().toUpperCase() !== CONFIRM_PHRASE
                      ? 0.4
                      : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: '#fff',
                      fontFamily: fonts.family.mono,
                      fontSize: 13,
                      letterSpacing: 2.4,
                      textTransform: 'uppercase',
                      fontWeight: '800',
                    }}
                  >
                    Delete forever
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setTyped('');
                  setStep(1);
                  setError(null);
                }}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Back to warning"
                style={{
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text style={{ color: text.tertiary, fontSize: 14, fontWeight: '600' }}>
                  Back
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
