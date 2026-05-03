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
import { ChevronLeft, Plus, Trash2, X, Library, Search, Check } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import { palette, text, accent, spacing, radii } from '../../../styles/theme';
import { ensureExercise, fetchExercises } from '../../../services/workoutService';
import type {
  DayOfWeek,
  PlanSession,
  ScheduledSession,
  SessionExercise,
  WorkoutPlan,
} from '../../../types/workout';
import {
  DayPicker,
  FocusPicker,
  PlanBasicInfo,
  SessionExerciseEditor,
  labelStyle,
  inputStyle,
} from './plan-creator';

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
  const [exerciseLibrary, setExerciseLibrary] = useState<{ id: string; name: string; muscleGroup: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browseSessionId, setBrowseSessionId] = useState<string | null>(null);
  const [browseQuery, setBrowseQuery] = useState('');
  const [browseSelectedIds, setBrowseSelectedIds] = useState<Set<string>>(new Set());

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
        setExerciseLibrary(rows.map((r) => ({ id: r.id, name: r.name, muscleGroup: r.muscle_group || 'other' }))),
      )
      .catch(() => {/* picker still works via free-text; library just empty */});
  }, [visible, exerciseLibrary.length]);

  const titleText = mode === 'edit' ? 'EDIT PLAN'
    : mode === 'duplicate' ? 'NEW PLAN FROM TEMPLATE'
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
      // ensureExercise checks the master library first then the user's
      // own user_exercises, inserting on miss. Lands in user_exercises
      // with the right RLS scope without us hand-rolling the insert.
      const created = await ensureExercise(q, userId);
      const entry = { id: created.id, name: created.name, muscleGroup: 'other' };
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

  // Batch-add: appends all selected library entries to a session in one
  // setSessions update (avoids N re-renders + cascade ordering bugs).
  const addExercisesFromLibrary = (
    sid: string,
    libExs: { id: string; name: string }[],
  ) => {
    if (libExs.length === 0) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        const existing = new Set(s.exercises.map((e) => e.id));
        const fresh = libExs.filter((lx) => !existing.has(lx.id));
        if (fresh.length === 0) return s;
        const start = s.exercises.length;
        return {
          ...s,
          exercises: [
            ...s.exercises,
            ...fresh.map((lx, i) => blankExercise(start + i + 1, lx.id, lx.name)),
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

  // Group library entries by muscle group for the browse modal, filtered by query.
  const browseGroups = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    const filtered = q
      ? exerciseLibrary.filter((e) => e.name.toLowerCase().includes(q))
      : exerciseLibrary;
    const byGroup = new Map<string, typeof exerciseLibrary>();
    filtered.forEach((e) => {
      const k = e.muscleGroup || 'other';
      const list = byGroup.get(k) || [];
      list.push(e);
      byGroup.set(k, list);
    });
    return Array.from(byGroup.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({ group, items }));
  }, [browseQuery, exerciseLibrary]);

  const closeBrowse = () => { setBrowseSessionId(null); setBrowseQuery(''); setBrowseSelectedIds(new Set()); };

  const toggleBrowseSelected = (id: string) => {
    setBrowseSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const browseTargetSession = useMemo(
    () => sessions.find((s) => s.id === browseSessionId) || null,
    [sessions, browseSessionId],
  );
  const alreadyInTargetSession = useMemo(
    () => new Set((browseTargetSession?.exercises || []).map((e) => e.id)),
    [browseTargetSession],
  );

  const confirmBrowseSelection = () => {
    if (!browseSessionId) return closeBrowse();
    const picked = exerciseLibrary.filter((e) => browseSelectedIds.has(e.id));
    addExercisesFromLibrary(browseSessionId, picked);
    closeBrowse();
  };

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
          <PlanBasicInfo
            name={name}
            description={description}
            onChangeName={setName}
            onChangeDescription={setDescription}
          />

          {/* Sessions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm }}>
            <Text style={labelStyle}>SESSIONS</Text>
            <TouchableOpacity
              testID="plan-creator-add-session"
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
              onOpenBrowse={() => { setBrowseQuery(''); setBrowseSelectedIds(new Set()); setBrowseSessionId(s.id); }}
            />
          ))}

          {error && (
            <Text style={{ color: accent.regression, marginTop: spacing.md, fontSize: 13 }}>
              {error}
            </Text>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <NeonButton testID="plan-creator-save-button" onPress={handleSave} disabled={saving} style={{ width: '100%' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', letterSpacing: 0.6 }}>
                {saving ? 'SAVING…' : (mode === 'edit' ? 'UPDATE PLAN' : 'SAVE PLAN')}
              </Text>
            </NeonButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Browse Exercises modal — picks into the session whose id is in browseSessionId. */}
      <Modal
        visible={browseSessionId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeBrowse}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: palette.bg }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
            <TouchableOpacity onPress={closeBrowse} accessibilityLabel="Close">
              <X size={22} color={text.primary} />
            </TouchableOpacity>
            <Text style={{ color: text.primary, fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1.6 }}>
              BROWSE EXERCISES
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderSubtle, borderRadius: radii.sm, paddingHorizontal: spacing.md }}>
              <Search size={16} color={text.quaternary} />
              <TextInput
                value={browseQuery}
                onChangeText={setBrowseQuery}
                placeholder="Search exercises…"
                placeholderTextColor={text.quaternary}
                style={{ flex: 1, color: text.primary, paddingVertical: spacing.sm, fontSize: 14 }}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
            keyboardShouldPersistTaps="handled"
          >
            {browseGroups.length === 0 ? (
              <Text style={{ color: text.quaternary, textAlign: 'center', marginTop: spacing.xl }}>
                No exercises match "{browseQuery}".
              </Text>
            ) : browseGroups.map(({ group, items }) => (
              <View key={group} style={{ marginBottom: spacing.lg }}>
                <Text style={[labelStyle, { marginBottom: spacing.xs }]}>{group.toUpperCase()}</Text>
                {items.map((ex) => {
                  const alreadyAdded = alreadyInTargetSession.has(ex.id);
                  const checked = browseSelectedIds.has(ex.id);
                  return (
                    <TouchableOpacity
                      key={ex.id}
                      disabled={alreadyAdded}
                      onPress={() => toggleBrowseSelected(ex.id)}
                      style={{
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: palette.borderSubtle,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        opacity: alreadyAdded ? 0.45 : 1,
                        backgroundColor: checked ? 'rgba(252, 76, 2, 0.08)' : 'transparent',
                      }}
                    >
                      <View style={{
                        width: 22, height: 22, borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: checked ? accent.lift : palette.borderSubtle,
                        backgroundColor: checked ? accent.lift : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && <Check size={14} color={palette.bg} strokeWidth={3} />}
                      </View>
                      <Text style={{ color: text.primary, fontSize: 14, flex: 1 }}>{ex.name}</Text>
                      {alreadyAdded && (
                        <Text style={{ color: text.quaternary, fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 }}>
                          ADDED
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Sticky footer — confirm batch selection. Disabled until ≥1 picked. */}
          <View style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: palette.borderSubtle,
            backgroundColor: palette.bg,
          }}>
            <NeonButton
              onPress={confirmBrowseSelection}
              disabled={browseSelectedIds.size === 0}
              style={{ width: '100%', opacity: browseSelectedIds.size === 0 ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', letterSpacing: 0.6 }}>
                {browseSelectedIds.size === 0
                  ? 'SELECT EXERCISES'
                  : `ADD ${browseSelectedIds.size} EXERCISE${browseSelectedIds.size === 1 ? '' : 'S'}`}
              </Text>
            </NeonButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Session card — header (name/focus/days) collapses, body opens inline.
// ---------------------------------------------------------------------------

type SessionCardProps = {
  session: DraftSession;
  isOpen: boolean;
  exerciseLibrary: { id: string; name: string; muscleGroup?: string }[];
  onToggleOpen: () => void;
  onChange: (patch: Partial<DraftSession>) => void;
  onRemove: () => void;
  onToggleDay: (day: DayOfWeek) => void;
  onUpdateExercise: (exId: string, patch: Partial<SessionExercise>) => void;
  onAddExerciseFromLibrary: (libEx: { id: string; name: string }) => void;
  onAddExerciseByText: (name: string) => Promise<void> | void;
  onRemoveExercise: (exId: string) => void;
  onOpenBrowse: () => void;
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
  onOpenBrowse,
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
          <FocusPicker selected={session.focus} onChange={(focus) => onChange({ focus })} />

          {/* Day chips */}
          <Text style={[labelStyle, { marginTop: spacing.md }]}>SCHEDULE</Text>
          <DayPicker selected={session.days} onToggle={onToggleDay} />

          {/* Exercises */}
          <Text style={[labelStyle, { marginTop: spacing.md }]}>EXERCISES</Text>
          {session.exercises.map((ex) => (
            <SessionExerciseEditor
              key={ex.id}
              exercise={ex}
              onUpdate={(patch) => onUpdateExercise(ex.id, patch)}
              onRemove={() => onRemoveExercise(ex.id)}
            />
          ))}

          {/* Add exercise: browse library OR type to search/create */}
          <View style={{ marginTop: spacing.xs }}>
            <TouchableOpacity
              testID="plan-creator-browse-exercises"
              onPress={onOpenBrowse}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                paddingVertical: spacing.sm,
                borderWidth: 1,
                borderColor: accent.lift,
                borderRadius: radii.sm,
                backgroundColor: 'rgba(252, 76, 2, 0.08)',
                marginBottom: spacing.sm,
              }}
              accessibilityLabel="Browse exercise library"
            >
              <Library size={14} color={accent.lift} />
              <Text style={{ color: accent.lift, fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>
                BROWSE EXERCISES
              </Text>
            </TouchableOpacity>
            <TextInput
              value={picker}
              onChangeText={setPicker}
              placeholder={adding ? 'Adding…' : 'Or type a custom exercise…'}
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

export default SlimPlanCreator;
