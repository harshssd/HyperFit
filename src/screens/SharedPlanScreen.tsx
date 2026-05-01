import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../components/ScreenLayout';
import GlassCard from '../components/GlassCard';
import NeonButton from '../components/NeonButton';
import { colors, spacing, radii } from '../styles/theme';
import { showError, showSuccess } from '../utils/alerts';
import { useUser } from '../contexts/UserContext';
import { useAppData } from '../contexts/AppDataContext';
import { getPlanByShareCode, importSharedPlan, fetchWorkoutPlanDetails } from '../services/workoutService';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SharedPlan'>;
type Props = NativeStackScreenProps<RootStackParamList, 'SharedPlan'>;

/**
 * Preview screen for a plan someone shared with us via deep link
 * (`hyperfit://plan/share/<uuid>`). Resolves the code through the
 * get_plan_by_share_code RPC; if sharing was revoked or the code is
 * unknown, shows an explicit "this link no longer works" state.
 *
 * Importing clones the entire plan tree (plan + sessions + exercises +
 * schedule) under the caller via the import_shared_plan SECURITY DEFINER
 * RPC, then refreshes data.workoutPlans so the new plan shows in My Plans.
 */
export const SharedPlanScreen = ({ route }: Props) => {
  const code = route.params?.code;
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { data, setData } = useAppData();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getPlanByShareCode(code);
        if (!cancelled) setPlan(result);
      } catch (e: any) {
        console.error('getPlanByShareCode', e);
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const importPlan = async () => {
    if (!user?.id) {
      showError('Sign in to import a shared plan.');
      return;
    }
    if (!code) return;
    setImporting(true);
    try {
      const newId = await importSharedPlan(code);
      // Hydrate the new plan so it lands in My Plans without a refetch.
      const detailed = await fetchWorkoutPlanDetails(newId);
      setData({ ...data, workoutPlans: [...(data.workoutPlans || []), detailed] });
      showSuccess(`Imported "${plan?.name ?? 'plan'}" into your library.`);
      // Pop back to wherever — the plan is already discoverable in the library.
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    } catch (e: any) {
      console.error('importSharedPlan', e);
      showError(e?.message || 'Could not import plan.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScreenLayout scroll={false} errorLabel="Error loading shared plan">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {loading && (
          <View style={{ alignItems: 'center', paddingTop: spacing.xl * 2 }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.muted, marginTop: spacing.sm }}>Resolving share link…</Text>
          </View>
        )}

        {!loading && !plan && (
          <GlassCard style={{ padding: spacing.lg, gap: spacing.sm }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Link no longer works</Text>
            <Text style={{ color: colors.muted, lineHeight: 20 }}>
              This share link has been revoked or the plan was deleted. Ask the sender for a new one.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] })}
              style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {!loading && plan && (
          <>
            <GlassCard style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 1, fontWeight: '700' }}>
                SHARED PLAN
              </Text>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{plan.name}</Text>
              {plan.description && (
                <Text style={{ color: colors.muted, lineHeight: 20 }}>{plan.description}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs }}>
                {plan.frequency != null && (
                  <Chip>{plan.frequency}× / week</Chip>
                )}
                {plan.equipment && <Chip>{plan.equipment}</Chip>}
                {plan.difficulty && <Chip>{plan.difficulty}</Chip>}
                {(plan.sessions || []).length > 0 && (
                  <Chip>{plan.sessions.length} sessions</Chip>
                )}
              </View>
            </GlassCard>

            {(plan.sessions || []).map((s: any) => (
              <GlassCard key={s.id} style={{ padding: spacing.md, gap: spacing.xs }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{s.name}</Text>
                {s.description && (
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{s.description}</Text>
                )}
                <View style={{ marginTop: spacing.xs, gap: 2 }}>
                  {(s.exercises || []).map((ex: any, i: number) => (
                    <Text key={`${s.id}-${i}`} style={{ color: '#cbd5e1', fontSize: 13 }}>
                      • {ex.name} — {ex.sets}×{ex.reps_min}–{ex.reps_max}
                    </Text>
                  ))}
                </View>
              </GlassCard>
            ))}

            <NeonButton onPress={importPlan} disabled={importing}>
              {importing ? 'Importing…' : 'Import to my library'}
            </NeonButton>
            <TouchableOpacity
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] })}
              style={{ alignSelf: 'center', marginTop: spacing.xs }}
            >
              <Text style={{ color: colors.muted, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <View style={{
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  }}>
    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
      {String(children).toUpperCase()}
    </Text>
  </View>
);
