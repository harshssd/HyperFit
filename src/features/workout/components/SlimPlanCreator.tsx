import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Plus, Trash2, X } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import { palette, text, accent, spacing, radii, fonts } from '../../../styles/theme';
import { createExercise, fetchExercises } from '../../../services/workoutService';
import type {
  DayOfWeek,
  PlanSession,
  ScheduledSession,
  SessionExercise,
  SessionFocus,
  WorkoutPlan,
} from '../../../types/workout';

const DAYS: { key: DayOfWeek; short: string }[] = [
  { key: 'monday',    short: 'M'  },
  { key: 'tuesday',   short: 'T'  },
  { key: 'wednesday', short: 'W'  },
  { key: 'thursday',  short: 'Th' },
  { key: 'friday',    short: 'F'  },
  { key: 'saturday',  short: 'Sa' },
  { key: 'sunday',    short: 'Su' },
];

const FOCUS_OPTIONS: { key: SessionFocus; label: string }[] = [
  { key: 'push',         label: 'PUSH' },
  { key: 'pull',         label: 'PULL' },
  { key: 'legs',         label: 'LEGS' },
  { key: 'upper',        label: 'UPPER' },
  { key: 'lower',        label: 'LOWER' },
  { key: 'full-body',    label: 'FULL' },
  { key: 'conditioning', label: 'COND' },
  { key: 'other',        label: 'OTHER' },
];

export type SlimPlanCreatorMode = 'create' | 'edit' | 'duplicate';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Owner of any newly-created exercises. RLS `exercises_write` requires
   *  `user_id = auth.uid()`, so free-text exercise creation fails silently
   *  if this isn't passed. */
  userId?: string;
  /** create: blank form. edit: prefill + write back to initialPlan.id.
   *  duplicate: prefill but always create a new plan. */
  mode?: SlimPlanCreatorMode;
  /** Required for `edit` and `duplicate`. */
  initialPlan?: WorkoutPlan;
  /** Called for create + duplicate. The PlanData shape matches what
   *  `usePlanActions.createPlan` expects (name/description/frequency/
   *  equipment/duration/difficulty/tags/sessions/schedule). */
  onCreatePlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'>) => Promise<void> | void;
  /** Called for edit. Receives the planId being updated and the new draft. */
  onUpdatePlan?: (
    planId: string,
    plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'>,
  ) => Promise<void> | void;
};

type DraftSession = PlanSession & { days: DayOfWeek[] };

const newId = () =>
  `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const blankSession = (): DraftSession => ({
  id: newId(),
  name: 'New Session',
  focus: 'push',
  exercises: [],
  days: [],
});

const blankExercise = (order: number, masterId: string, name: string): SessionExercise => ({
  // `id` MUST be the master exercises.id UUID — it's used as plan_exercises
  // .exercise_id (FK). Caller resolves library match or createExercise()
  // before constructing this object.
  id: masterId,
  name,
  primaryMuscleGroup: 'other',
  sets: 3,
  repRange: { min: 8, max: 10 },
  restSeconds: 90,
  order,
});

const fromInitialPlan = (plan: WorkoutPlan): DraftSession[] => {
  // Schedule maps day → [{sessionId}]. Invert to per-session day list.
  const daysBySession: Record<string, DayOfWeek[]> = {};
  Object.entries(plan.schedule || {}).forEach(([day, scheduled]) => {
    (scheduled || []).forEach((s: ScheduledSession) => {
      const list = daysBySession[s.sessionId] || (daysBySession[s.sessionId] = []);
      if (!list.includes(day as DayOfWeek)) list.push(day as DayOfWeek);
    });
  });
  return (plan.sessions || []).map((s) => ({
    ...s,
    exercises: s.exercises || [],
    days: daysBySession[s.id] || [],
  }));
};

export const SlimPlanCreator = ({
  visible,
  onClose,
  userId,
  mode = 'create',
  initialPlan,
  onCreatePlan,
  onUpdatePlan,
}: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sessions, setSessions] = useState<DraftSession[]>([]);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [exerciseLibrary, setExerciseLibrary] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate / reset whenever the modal opens.
  useEffect(() => {
    if (!visible) return;
    if ((mode === 'edit' || mode === 'duplicate') && initialPlan) {
      setName(mode === 'duplicate' ? `${initialPlan.name} (Copy)` : initialPlan.name);
      setDescription(initialPlan.description || '');
      setSessions(fromInitialPlan(initialPlan));
    } else {
      setName('');
      setDescription('');
      setSessions([blankSession()]);
    }
    setOpenSessionId(null);
    setError(null);
  }, [visible, mode, initialPlan]);

  // Lazy load the exercise picker dataset on first open.
  useEffect(() => {
    if (!visible || exerciseLibrary.length > 0) return;
    fetchExercises()
      .then((rows: any[]) =>
        setExerciseLibrary(rows.map((r) => ({ id: r.id, name: r.name }))),
      )
      .catch(() => {/* picker still works via free-text; library just empty */});
  }, [visible, exerciseLibrary.length]);

  const titleText = mode === 'edit' ? 'EDIT PLAN'
    : mode === 'duplicate' ? 'DUPLICATE PLAN'
    : 'CREATE PLAN';

  const updateSession = (sid: string, patch: Partial<DraftSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  };

  const removeSession = (sid: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sid));
    if (openSessionId === sid) setOpenSessionId(null);
  };

  const addSession = () => {
    const s = blankSession();
    setSessions((prev) => [...prev, s]);
    setOpenSessionId(s.id);
  };

  const toggleDay = (sid: string, day: DayOfWeek) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              days: s.days.includes(day)
                ? s.days.filter((d) => d !== day)
                : [...s.days, day],
            }
          : s,
      ),
    );
  };

  const updateExercise = (
    sid: string,
    exId: string,
    patch: Partial<SessionExercise>,
  ) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              exercises: s.exercises.map((e) =>
                e.id === exId ? { ...e, ...patch } : e,
              ),
            }
          : s,
      ),
    );
  };

  // Resolve a typed name to a master-exercise UUID — match the library
  // case-insensitively first, fall back to creating a new private exercise.
  // Returns null on failure so the caller can surface an error.
  const resolveExerciseId = async (raw: string): Promise<{ id: string; name: string } | null> => {
    const q = raw.trim();
    if (!q) return null;
    const match = exerciseLibrary.find((e) => e.name.toLowerCase() === q.toLowerCase());
    if (match) return match;
    if (!userId) {
      setError('Sign in to add new exercises.');
      return null;
    }
    try {
      // RLS `exercises_write` requires user_id = auth.uid() on insert. Without
      // user_id the policy rejects with a confusing 42501 error.
      const created: any = await createExercise({
        user_id: userId,
        name: q,
        muscle_group: 'other',
        equipment: 'mixed',
        is_public: false,
      } as any);
      const entry = { id: created.id, name: created.name };
      setExerciseLibrary((prev) => [...prev, entry]);
      return entry;
    } catch (e: any) {
      setError(e?.message || `Could not add exercise "${q}".`);
      return null;
    }
  };

  const addExerciseFromLibrary = (sid: string, libEx: { id: string; name: string }) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        if (s.exercises.some((e) => e.id === libEx.id)) return s; // dedupe
        return {
          ...s,
          exercises: [
            ...s.exercises,
            blankExercise(s.exercises.length + 1, libEx.id, libEx.name),
          ],
        };
      }),
    );
  };

  const addExerciseByText = async (sid: string, name: string) => {
    const resolved = await resolveExerciseId(name);
    if (!resolved) return;
    addExerciseFromLibrary(sid, resolved);
  };

  const removeExercise = (sid: string, exId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, exercises: s.exercises.filter((e) => e.id !== exId) }
          : s,
      ),
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Plan needs a name.';
    if (sessions.length === 0) return 'Add at least one session.';
    const empty = sessions.find((s) => s.exercises.length === 0);
    if (empty) return `Add at least one exercise to "${empty.name}".`;
    const noDays = sessions.find((s) => s.days.length === 0);
    if (noDays) return `Schedule "${noDays.name}" on at least one day.`;
    return null;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);
    try {
      // Re-derive the {day -> ScheduledSession[]} schedule from per-session
      // selected days. Ordering within a day = order the session was added.
      const schedule: { [K in DayOfWeek]?: ScheduledSession[] } = {};
      sessions.forEach((s, i) => {
        s.days.forEach((day) => {
          const list = schedule[day] || (schedule[day] = []);
          list.push({ sessionId: s.id, order: i });
        });
      });

      // Frequency = total scheduled session-days. Equipment / difficulty /
      // duration aren't user-input in v1 — sensible defaults so existing
      // service code keeps working.
      const totalScheduled = Object.values(schedule).reduce(
        (acc, arr) => acc + (arr?.length || 0), 0,
      );
      const frequency = Math.max(1, Math.min(7, totalScheduled));

      const draft: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'> = {
        name: name.trim(),
        description: description.trim(),
        frequency,
        equipment: 'gym',
        duration: 8,
        difficulty: 'intermediate',
        tags: [],
        sessions: sessions.map(({ days, ...s }) => s),
        schedule,
      };

      if (mode === 'edit' && initialPlan && onUpdatePlan) {
        await onUpdatePlan(initialPlan.id, draft);
      } else {
        await onCreatePlan(draft);
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save plan.');
    } finally {
      setSaving(false);
    }
  };

  const openSession = useMemo(
    () => sessions.find((s) => s.id === openSessionId) || null,
    [sessions, openSessionId],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: palette.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
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
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <ChevronLeft size={24} color={text.primary} />
          </TouchableOpacity>
          <Text style={{ color: text.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1.6 }}>
            {titleText}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name + description */}
          <Text style={labelStyle}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="My plan"
            placeholderTextColor={text.quaternary}
            style={inputStyle}
          />

          <Text style={[labelStyle, { marginTop: spacing.md }]}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What is this plan about?"
            placeholderTextColor={text.quaternary}
            multiline
            style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
          />

          {/* Sessions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm }}>
            <Text style={labelStyle}>SESSIONS</Text>
            <TouchableOpacity
              onPress={addSession}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              accessibilityLabel="Add session"
            >
              <Plus size={14} color={accent.lift} />
              <Text style={{ color: accent.lift, fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>ADD</Text>
            </TouchableOpacity>
          </View>

          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              isOpen={openSessionId === s.id}
              exerciseLibrary={exerciseLibrary}
              onToggleOpen={() => setOpenSessionId(openSessionId === s.id ? null : s.id)}
              onChange={(patch) => updateSession(s.id, patch)}
              onRemove={() => removeSession(s.id)}
              onToggleDay={(d) => toggleDay(s.id, d)}
              onUpdateExercise={(exId, patch) => updateExercise(s.id, exId, patch)}
              onAddExerciseFromLibrary={(libEx) => addExerciseFromLibrary(s.id, libEx)}
              onAddExerciseByText={(exName) => addExerciseByText(s.id, exName)}
              onRemoveExercise={(exId) => removeExercise(s.id, exId)}
            />
          ))}

          {error && (
            <Text style={{ color: accent.regression, marginTop: spacing.md, fontSize: 13 }}>
              {error}
            </Text>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <NeonButton onPress={handleSave} disabled={saving} style={{ width: '100%' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', letterSpacing: 0.6 }}>
                {saving ? 'SAVING…' : (mode === 'edit' ? 'UPDATE PLAN' : 'SAVE PLAN')}
              </Text>
            </NeonButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Session card — header (name/focus/days) collapses, body opens inline.
// ---------------------------------------------------------------------------

type SessionCardProps = {
  session: DraftSession;
  isOpen: boolean;
  exerciseLibrary: { id: string; name: string }[];
  onToggleOpen: () => void;
  onChange: (patch: Partial<DraftSession>) => void;
  onRemove: () => void;
  onToggleDay: (day: DayOfWeek) => void;
  onUpdateExercise: (exId: string, patch: Partial<SessionExercise>) => void;
  onAddExerciseFromLibrary: (libEx: { id: string; name: string }) => void;
  onAddExerciseByText: (name: string) => Promise<void> | void;
  onRemoveExercise: (exId: string) => void;
};

const SessionCard = ({
  session,
  isOpen,
  exerciseLibrary,
  onToggleOpen,
  onChange,
  onRemove,
  onToggleDay,
  onUpdateExercise,
  onAddExerciseFromLibrary,
  onAddExerciseByText,
  onRemoveExercise,
}: SessionCardProps) => {
  const [picker, setPicker] = useState('');
  const [adding, setAdding] = useState(false);
  const suggestions = useMemo(() => {
    const q = picker.trim().toLowerCase();
    if (!q) return [];
    return exerciseLibrary
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [picker, exerciseLibrary]);

  return (
    <GlassCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
      {/* Header — tap to expand */}
      <TouchableOpacity onPress={onToggleOpen} accessibilityLabel="Toggle session editor">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text.primary, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
              {session.name || 'Untitled'}
            </Text>
            <Text style={{ color: text.quaternary, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 }}>
              {session.focus.toUpperCase()} · {session.exercises.length} EXERCISE{session.exercises.length === 1 ? '' : 'S'} · {session.days.length} DAY{session.days.length === 1 ? '' : 'S'}
            </Text>
          </View>
          <TouchableOpacity onPress={onRemove} style={{ padding: 6 }} accessibilityLabel="Remove session">
            <Trash2 size={16} color={text.quaternary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={{ marginTop: spacing.md }}>
          {/* Name */}
          <Text style={labelStyle}>SESSION NAME</Text>
          <TextInput
            value={session.name}
            onChangeText={(v) => onChange({ name: v })}
            placeholder="Day A"
            placeholderTextColor={text.quaternary}
            style={inputStyle}
          />

          {/* Focus chips */}
          <Text style={[labelStyle, { marginTop: spacing.md }]}>FOCUS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {FOCUS_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => onChange({ focus: f.key })}
                style={[chipStyle, session.focus === f.key && chipActiveStyle]}
              >
                <Text style={[chipTextStyle, session.focus === f.key && chipTextActiveStyle]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Day chips */}
          <Text style={[labelStyle, { marginTop: spacing.md }]}>SCHEDULE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {DAYS.map((d) => {
              const on = session.days.includes(d.key);
              return (
                <TouchableOpacity
                  key={d.key}
                  onPress={() => onToggleDay(d.key)}
                  style={[dayChipStyle, on && dayChipActiveStyle]}
                  accessibilityLabel={`Toggle ${d.key}`}
                >
                  <Text style={[dayChipTextStyle, on && dayChipTextActiveStyle]}>{d.short}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Exercises */}
          <Text style={[labelStyle, { marginTop: spacing.md }]}>EXERCISES</Text>
          {session.exercises.map((ex) => (
            <View key={ex.id} style={{ marginBottom: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: palette.borderSubtle, borderRadius: radii.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextInput
                  value={ex.name}
                  onChangeText={(v) => onUpdateExercise(ex.id, { name: v })}
                  placeholder="Exercise name"
                  placeholderTextColor={text.quaternary}
                  style={[inputStyle, { flex: 1, marginRight: spacing.sm, marginBottom: 0 }]}
                />
                <TouchableOpacity onPress={() => onRemoveExercise(ex.id)} accessibilityLabel="Remove exercise">
                  <X size={16} color={text.quaternary} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                <NumField label="SETS" value={ex.sets} onChange={(n) => onUpdateExercise(ex.id, { sets: n })} />
                <NumField label="MIN" value={ex.repRange.min} onChange={(n) => onUpdateExercise(ex.id, { repRange: { ...ex.repRange, min: n } })} />
                <NumField label="MAX" value={ex.repRange.max} onChange={(n) => onUpdateExercise(ex.id, { repRange: { ...ex.repRange, max: n } })} />
                <NumField label="REST" value={ex.restSeconds || 0} onChange={(n) => onUpdateExercise(ex.id, { restSeconds: n })} />
              </View>
            </View>
          ))}

          {/* Add exercise: search OR free-text */}
          <View style={{ marginTop: spacing.xs }}>
            <TextInput
              value={picker}
              onChangeText={setPicker}
              placeholder={adding ? 'Adding…' : 'Add exercise by name…'}
              placeholderTextColor={text.quaternary}
              editable={!adding}
              style={[inputStyle, adding && { opacity: 0.6 }]}
              onSubmitEditing={async () => {
                const q = picker.trim();
                if (!q || adding) return;
                setAdding(true);
                try {
                  await onAddExerciseByText(q);
                  setPicker('');
                } finally {
                  setAdding(false);
                }
              }}
              returnKeyType="done"
            />
            {suggestions.length > 0 && !adding && (
              <View style={{ marginTop: spacing.xs, borderWidth: 1, borderColor: palette.borderSubtle, borderRadius: radii.sm }}>
                {suggestions.map((sug) => (
                  <TouchableOpacity
                    key={sug.id}
                    onPress={() => { onAddExerciseFromLibrary(sug); setPicker(''); }}
                    style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.borderSubtle }}
                  >
                    <Text style={{ color: text.primary }}>{sug.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const NumField = ({
  label, value, onChange,
}: { label: string; value: number; onChange: (n: number) => void }) => (
  <View style={{ flex: 1 }}>
    <Text style={[labelStyle, { fontSize: 9, marginBottom: 2 }]}>{label}</Text>
    <TextInput
      value={String(value)}
      onChangeText={(v) => {
        const n = parseInt(v, 10);
        onChange(Number.isFinite(n) && n >= 0 ? n : 0);
      }}
      keyboardType="number-pad"
      style={[inputStyle, {
        fontVariant: fonts.tabularNums as any,
        textAlign: 'center',
        marginBottom: 0,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.xs,
      }]}
    />
  </View>
);

// ---------------------------------------------------------------------------
// Local style tokens (kept inline; this is the only consumer).
// ---------------------------------------------------------------------------

const labelStyle = {
  color: text.tertiary,
  fontFamily: 'monospace' as const,
  fontSize: 10,
  fontWeight: '700' as const,
  letterSpacing: 1.4,
  marginBottom: 4,
};

const inputStyle = {
  color: text.primary,
  backgroundColor: palette.surface,
  borderWidth: 1,
  borderColor: palette.borderSubtle,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  fontSize: 14,
  marginBottom: spacing.xs,
};

const chipStyle = {
  paddingHorizontal: spacing.sm,
  paddingVertical: 4,
  borderRadius: radii.sm,
  borderWidth: 1,
  borderColor: palette.borderSubtle,
};

const chipActiveStyle = {
  borderColor: accent.lift,
  backgroundColor: 'rgba(252, 76, 2, 0.08)',
};

const chipTextStyle = {
  color: text.tertiary,
  fontFamily: 'monospace' as const,
  fontSize: 10,
  fontWeight: '700' as const,
  letterSpacing: 1.2,
};

const chipTextActiveStyle = {
  color: accent.lift,
};

const dayChipStyle = {
  width: 36,
  height: 36,
  borderRadius: radii.sm,
  borderWidth: 1,
  borderColor: palette.borderSubtle,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const dayChipActiveStyle = {
  borderColor: accent.lift,
  backgroundColor: 'rgba(252, 76, 2, 0.12)',
};

const dayChipTextStyle = {
  color: text.tertiary,
  fontFamily: 'monospace' as const,
  fontSize: 11,
  fontWeight: '700' as const,
};

const dayChipTextActiveStyle = {
  color: accent.lift,
};

export default SlimPlanCreator;
