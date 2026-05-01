# GymView Modal Split — Plan

**Status:** proposed
**Owner:** TBD
**Spans:** ~4 PRs
**Scope:** Move the active workout out of the Gym tab into a modal stack
screen, persist in-progress sessions across app kills, and pull plan
authoring into its own modal. Slim `GymView.tsx` from ~1.2k lines down to
the planner/landing surface.

## Decisions (locked from /ask-user-questions)

| # | Decision | Implication |
|---|---|---|
| 1 | Active workout is a **full-screen modal** | New `ActiveWorkoutScreen` mounted on the root stack, not inside the tabs. |
| 2 | Persist in-progress session **locally** (AsyncStorage), resume on reopen | New `useSessionPersistence` hook; no server writes until finish. |
| 3 | Plan creation/editing is a **modal stack screen** | `WorkoutPlanCreator` becomes a modal route, dismissed via header X. |
| 4 | Tabs **visible** while workout modal is open | Use `presentation: 'transparentModal'` — modal sits over tabs without unmounting them. Pair with a minimize button so the user can use Plans/History without abandoning the session. |

## Current state

- `GymView.tsx` (~1.2k lines) is the only consumer of `useWorkoutSession`. It owns:
  - the planner empty/active-plan landing (`WorkoutPlanner` + `QuickStartTemplates`)
  - the in-progress session UI (`WorkoutFocusHeader`, `WorkoutFocusSets`, `WorkoutFocusActions`, `RestTimerBar`)
  - the finished-session summary (`FinishedSessionView`)
  - 5 modals declared in JSX (template picker, save template, create folder, add exercise overlay, plans library)
  - plan creator (`WorkoutPlanCreator` rendered when `showPlanCreator`)
- Modal stack already exists in `src/navigation/RootNavigator.tsx` (per PR #2). Currently only `PlaceholderModal` is registered.

## Target shape

```
src/screens/
  GymScreen.tsx              ← thin wrapper; renders <Planner /> only
  ActiveWorkoutScreen.tsx    ← modal route; renders the focus/list/finish UI
  PlanEditorScreen.tsx       ← modal route; wraps WorkoutPlanCreator

src/navigation/
  RootNavigator.tsx          ← register ActiveWorkout + PlanEditor modal routes
  types.ts                   ← extend RootStackParamList
```

`useWorkoutSession` is hoisted into a context provider (`WorkoutSessionProvider`) at the root so both `GymScreen` (for "Resume Workout" pill, status) and `ActiveWorkoutScreen` (for everything else) read the same instance.

## PR plan

### PR 1 — Hoist useWorkoutSession into a context

**Goal:** make session state globally readable without changing UX.

- New `src/contexts/WorkoutSessionContext.tsx`:
  - `<WorkoutSessionProvider>` calls `useRestTimer()` + `useWorkoutSession()` once.
  - Exposes the same return shape via `useActiveWorkoutSession()`.
- Mount the provider in `App.tsx` between `AuthProvider` and `RootNavigator`.
- `GymView.tsx` switches from local hook to context. No behavioral change.

**Risk:** medium. `useWorkoutSession` reads `activeUserPlan` which lives on `useUserData`; either pass it through context or expose `setActiveUserPlan` on the provider. **Mitigation:** make the provider take `activeUserPlan` as a prop, mount it inside whatever already has `useUserData` access.

**Verify:** typecheck green; manual: start a workout, log a set, finish — same behavior as today.

### PR 2 — Carve `ActiveWorkoutScreen` out of GymView

**Goal:** move the in-progress UI to a modal route.

- New `src/screens/ActiveWorkoutScreen.tsx`. Move from GymView:
  - `renderWorkoutFocus()`, `renderWorkoutList()`, `renderFinished()`
  - the 4 modals scoped to active workout (template picker, save template, create folder, add exercise overlay)
  - `viewMode`, `currentExIndex`, `selectExercise`, `nextExercise`, `prevExercise` state — these belong with the workout, not the planner.
- Add to `RootStackParamList`: `ActiveWorkout: undefined`.
- In `RootNavigator.tsx`, register the route with `presentation: 'transparentModal'`, `headerShown: false`, `gestureEnabled: true`.
- `GymView.tsx` collapses to ~400 lines (planner + plan-creator gate only).
- Replace `startSession` callsites (the planner's "START WORKOUT", quick-start tiles) with `navigation.navigate('ActiveWorkout')`. The session state is already populated via `useActiveWorkoutSession()` in the provider.

**Risk:** high. Lots of state moves between files; easy to lose a callback wire. **Mitigation:** keep a checklist of every prop passed from GymView into `WorkoutFocus*` components and verify each is sourced from the context post-move. Use the existing adversarial-review pattern.

**Verify:**
- Tabs remain visible while ActiveWorkoutScreen is open (visual confirm on iOS + Android).
- Back gesture / explicit "X" both close the modal without ending the session.
- Rest timer continues counting while user navigates away (already true since `useRestTimer` lives in the context).

### PR 3 — Persist in-progress session to AsyncStorage

**Goal:** kill the app mid-set, reopen, get a "Resume Push Day from 12 min ago?" prompt.

- New `src/features/workout/hooks/useSessionPersistence.ts`:
  - On every change to `sessionExercises | sessionStartTime | sessionContext`, debounce-write a snapshot to AsyncStorage (key: `hyperfit:active-session:${userId}`).
  - On `WorkoutSessionProvider` mount, read the snapshot. If present, show a sheet: "Resume {sessionContext.customName ?? 'workout'} from {relativeTime(sessionStartTime)}? [Resume] [Discard]".
  - Clear the snapshot on `finishWorkout` and `abortSession`.
- The snapshot is the source of truth between resume and finish; nothing writes to Supabase until the user taps Finish.

**Edge cases to encode:**
- App killed during finishWorkout's Supabase insert → on reopen, the snapshot is still there and the rows didn't land. Resume = re-attempt finish. Discard = drop both.
- User logged in as A, killed app, logged in as B → snapshot key includes `userId` so B doesn't see A's session.
- Storage write fails (full disk) → log and continue; user loses persistence but the live session is unaffected.

**Risk:** medium. AsyncStorage is async + serialization edge cases (`Date` objects, refs).
**Mitigation:** snapshot only plain-JSON shapes; `JSON.stringify(serializeSession(state))` + a counterpart `deserializeSession`.

**Verify:**
- Log 3 sets, force-quit, reopen → resume prompt appears, sets are intact.
- Tap Discard → snapshot cleared, session empty.
- Finish a workout → snapshot cleared.

### PR 4 — Carve `PlanEditorScreen` out of GymView

**Goal:** plan create/edit is its own modal route.

- New `src/screens/PlanEditorScreen.tsx` wrapping `WorkoutPlanCreator`.
- `RootStackParamList: PlanEditor: { planId?: string; suggestedType?: EquipmentType }`.
- Replace `setShowPlanCreator(true)` callsites with `navigation.navigate('PlanEditor', { … })`.
- Drop the inline `<WorkoutPlanCreator visible={…} />` modal from GymView.
- Drop `showPlanCreator`, `suggestedPlanType`, `setShowPlanCreator` state.

**Risk:** low. Mostly a route move; `WorkoutPlanCreator` is already self-contained.

**Verify:** open from Gym tab; deep link `hyperfit://plan-editor` (linking config update) opens it; back returns to caller.

## Out of scope (explicit)

- Tab bar styling changes (modal sits above without redesigning the bar).
- Realtime sync of in-progress sessions across devices — local-only persistence per the decision.
- Splitting `WorkoutPlanCreator` itself (it's ~1.2k lines too — separate task).
- Migrating `data.workouts` off the in-memory blob (task #4).

## Open questions

1. **Resume prompt UI** — sheet vs. inline banner on Gym tab? (Suggest: inline banner, since sheet on cold start is jarring.)
2. **Multiple devices, same user** — if AsyncStorage on iPad has a snapshot but iPhone is the active client, both devices show "Resume" on reopen. Acceptable for v1; revisit when we add realtime.
3. **Modal-over-tabs gesture** — react-navigation's `transparentModal` preserves underlying screens but standard back-gesture dismisses on iOS. Confirm we want swipe-down dismiss (= minimize) vs. requiring explicit X.

## Success criteria

- [ ] `GymView.tsx` ≤ 500 lines.
- [ ] Killing the app mid-workout and reopening preserves all logged sets.
- [ ] Tab bar visible while in active workout (per locked decision #4).
- [ ] Plan creation accessible via `navigation.navigate('PlanEditor')`.
- [ ] CI typecheck remains green at every commit.
