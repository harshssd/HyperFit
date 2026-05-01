import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Share, ActivityIndicator, Switch } from 'react-native';
import * as Linking from 'expo-linking';
import GlassCard from './GlassCard';
import { palette, text, accent, spacing, radii } from '../styles/theme';
import type { WorkoutPlan } from '../types/workout';

type Props = {
  visible: boolean;
  plan: WorkoutPlan | null;
  onClose: () => void;
  onToggleShareable: (plan: WorkoutPlan, value: boolean) => Promise<void>;
  onRotateCode: (plan: WorkoutPlan) => Promise<void>;
};

/**
 * Bottom-sheet style modal that lets the owner of a plan toggle sharing,
 * grab the share URL via the native share sheet (which on both iOS and
 * Android includes a "Copy" target), and rotate the code to invalidate
 * any previously distributed link.
 *
 * URL format: `<app-prefix>plan/share/<share_code>` — resolved by the
 * SharedPlan deep-link route. `Linking.createURL` returns the right
 * scheme automatically (hyperfit:// in production, exp://... in dev).
 */
const SharePlanModal = ({ visible, plan, onClose, onToggleShareable, onRotateCode }: Props) => {
  const [busyToggle, setBusyToggle] = useState(false);
  const [busyRotate, setBusyRotate] = useState(false);

  if (!plan) return null;

  const url = plan.share_code ? Linking.createURL('plan/share/' + plan.share_code) : '';

  const onToggle = async (next: boolean) => {
    if (busyToggle) return;
    setBusyToggle(true);
    try { await onToggleShareable(plan, next); } finally { setBusyToggle(false); }
  };

  const onRotate = async () => {
    if (busyRotate) return;
    setBusyRotate(true);
    try { await onRotateCode(plan); } finally { setBusyRotate(false); }
  };

  const onShare = async () => {
    if (!url) return;
    try {
      await Share.share({
        message: `Check out my workout plan "${plan.name}" on HyperFit: ${url}`,
        url,
        title: plan.name,
      });
    } catch {
      // Native share sheet was dismissed — no-op.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <GlassCard style={{
          padding: spacing.lg,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
          gap: spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: text.primary, fontSize: 18, fontWeight: '700' }}>Share plan</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: text.tertiary, fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: text.tertiary, fontSize: 13, lineHeight: 18 }}>
            Sharing this plan gives anyone with the link a preview and a one-tap import. It does NOT
            publish the plan to the public library — that's a separate "Publish" flow with admin review.
          </Text>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing.sm,
          }}>
            <Text style={{ color: text.primary, fontSize: 15, fontWeight: '600' }}>
              Allow sharing via link
            </Text>
            <Switch
              value={!!plan.is_shareable}
              onValueChange={onToggle}
              disabled={busyToggle}
            />
          </View>

          {plan.is_shareable && (
            <>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: spacing.sm,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}>
                <Text style={{ color: text.secondary, fontSize: 12 }} selectable numberOfLines={2}>
                  {url || '—'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={onShare}
                  style={{
                    flex: 1,
                    backgroundColor: accent.lift,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.sm,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: palette.bg, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13 }}>Share link</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onRotate}
                  disabled={busyRotate}
                  style={{
                    flex: 1,
                    backgroundColor: palette.surface,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.sm,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: palette.borderStrong,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: spacing.xs,
                  }}
                >
                  {busyRotate && <ActivityIndicator size="small" color="#cbd5e1" />}
                  <Text style={{ color: text.secondary, fontWeight: '700' }}>
                    {busyRotate ? 'Rotating…' : 'New link'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: text.tertiary, fontSize: 11, lineHeight: 16 }}>
                "New link" invalidates the old code immediately. Use it if you accidentally shared too widely.
              </Text>
            </>
          )}
        </GlassCard>
      </View>
    </Modal>
  );
};

export default SharePlanModal;
