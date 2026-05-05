import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  Dumbbell,
  Play,
  Calendar,
  CheckCircle,
  ChevronRight,
  Droplet,
  Layout,
  PlusCircle,
  UtensilsCrossed,
} from 'lucide-react-native';
import GlassCard from './GlassCard';
import { homeStyles } from '../styles';
import { palette, text, accent, spacing, radii, fonts } from '../styles/theme';
import { UserData } from '../types/workout';
import { getWorkoutForDate, getUpcomingWorkouts } from '../features/workout/helpers';
import NeonButton from './NeonButton';
import CalendarView from '../features/calendar/CalendarView';

type UpcomingWorkout = ReturnType<typeof getUpcomingWorkouts>[number];

type HomeViewProps = {
  data: UserData;
  onChangeView: (view: string) => void;
  // Streak/XP live in the Header / History now; props retained for back-compat.
  streak?: number;
  xp?: number;
  /** Start a blank session immediately. */
  onStartCustom?: () => void;
  /** Start a planned session from the active plan, identified by its
   *  plan_sessions.id. Skips the Plans tab detour. */
  onStartUpcoming?: (planSessionId: string) => void;
  /** Open the plan library in session-pick mode (alternate workout flow). */
  onPickFromLibrary?: () => void;
  /** Navigate to the Nutrition tab and open the Add Meal modal. */
  onLogMeal?: () => void;
  /** Navigate to the Nutrition tab (water +CUP / +BOTTLE buttons are
   *  always visible there, so no extra intent is needed). */
  onLogWater?: () => void;
};

const HomeView = ({
  data,
  onChangeView,
  onStartCustom,
  onStartUpcoming,
  onPickFromLibrary,
  onLogMeal,
  onLogWater,
}: HomeViewProps) => {
  const handleLogMeal = onLogMeal ?? (() => onChangeView('nutrition'));
  const handleLogWater = onLogWater ?? (() => onChangeView('nutrition'));
  const today = new Date();
  const activePlan = data.userWorkoutPlans?.find(p => p.isActive);
  const todaysWorkout = getWorkoutForDate(today, [], activePlan);

  // Look ahead two sessions starting tomorrow: [next, nextAfter]. Used by:
  // - rest-day footer (next only)
  // - completed-day pivot (next as hero, nextAfter as footer)
  const upcoming = getUpcomingWorkouts(activePlan, 2, 1);
  const upcomingWorkout: UpcomingWorkout | undefined = upcoming[0];
  const sessionAfterNext: UpcomingWorkout | undefined = upcoming[1];

  const upcomingLabel = (daysUntil: number, date: Date) => {
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }
    return `In ${daysUntil} days`;
  };

  // Soft duration estimate — ~9 min per exercise (3 sets × ~3 min incl. rest),
  // rounded to nearest 5 so it never reads as a precise number. Beats showing
  // a hardcoded "~60" that's wrong for a 4-exercise day.
  const estimateMinutes = (exercises: number) =>
    Math.max(15, Math.round((exercises * 9) / 5) * 5);

  // Tap-target for the next-session affordance. Starts the planned session
  // directly when the parent has wired the callback; falls back to the
  // legacy "navigate to Plans" path so the screen still works in contexts
  // that don't pass session helpers in.
  const startUpcoming = (workout: UpcomingWorkout | undefined) => {
    if (workout?.sessionId && onStartUpcoming) {
      onStartUpcoming(workout.sessionId);
      return;
    }
    onChangeView('gym');
  };
  const handleStartCustom = onStartCustom ?? (() => onChangeView('gym'));
  const handlePickFromLibrary = onPickFromLibrary ?? (() => onChangeView('gym'));

  // Reusable section caption — small uppercase mono label that anchors each
  // sub-block to the broader visual language ("ACTIVE PLAN", "UP NEXT", etc).
  const Eyebrow = ({
    children,
    color = text.quaternary,
  }: {
    children: React.ReactNode;
    color?: string;
  }) => (
    <Text
      style={{
        color,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.6,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );

  // Inset banner row used by secondary actions (Start Custom Workout) and
  // navigational footers (Next Session). Mirrors the active-plan header
  // icon-chip + eyebrow + title pattern in a neutral palette so the whole
  // card reads as one design system.
  const BannerRow = ({
    icon,
    iconColor = text.primary,
    iconTint = palette.surfaceAlt,
    iconBorderColor = palette.borderStrong,
    eyebrow,
    eyebrowColor,
    title,
    sub,
    rightSlot,
    onPress,
    testID,
    accessibilityLabel,
    flat = false,
  }: {
    icon: React.ReactNode;
    iconColor?: string;
    iconTint?: string;
    iconBorderColor?: string;
    eyebrow: string;
    eyebrowColor?: string;
    title: string;
    sub?: string;
    rightSlot?: React.ReactNode;
    onPress?: () => void;
    testID?: string;
    accessibilityLabel?: string;
    // When inside a card already (e.g. the Active Plan card), use flat to
    // drop the border/background so the row reads as a list item, not a
    // nested mini-card. Caller renders dividers between flat rows.
    flat?: boolean;
  }) => {
    const inner = (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: flat ? spacing.sm : spacing.md,
          paddingHorizontal: flat ? 0 : spacing.md,
          borderRadius: flat ? 0 : radii.md,
          borderWidth: flat ? 0 : 1,
          borderColor: palette.borderStrong,
          backgroundColor: flat ? 'transparent' : palette.surfaceAlt,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: iconTint,
            borderWidth: 1,
            borderColor: iconBorderColor,
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Eyebrow color={eyebrowColor ?? text.quaternary}>{eyebrow}</Eyebrow>
          <Text
            style={{
              color: text.primary,
              fontSize: 15,
              fontWeight: '800',
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {sub ? (
            <Text style={{ color: text.tertiary, fontSize: 12 }}>{sub}</Text>
          ) : null}
        </View>
        {rightSlot}
      </View>
    );

    if (!onPress) return inner;
    return (
      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {inner}
      </TouchableOpacity>
    );
  };

  // Numeric stat readout used in scheduled-today / completed branches.
  const Stat = ({ value, label }: { value: string | number; label: string }) => (
    <View>
      <Text
        style={{
          color: text.primary,
          fontSize: 22,
          fontWeight: '900',
          letterSpacing: -0.4,
          fontVariant: fonts.tabularNums,
        }}
      >
        {value}
      </Text>
      <Eyebrow>{label}</Eyebrow>
    </View>
  );

  // Footer block under any "Today's focus" state. Tappable: mirrors the
  // primary START WORKOUT path so motivated users can lift early.
  const renderNextSessionFooter = (workout: UpcomingWorkout | undefined) => {
    if (!workout) return null;
    return (
      <BannerRow
        testID="home-next-session"
        onPress={() => startUpcoming(workout)}
        accessibilityLabel={`Start ${workout.name} early — ${upcomingLabel(workout.daysUntil, workout.date)}`}
        icon={<Calendar size={16} color={accent.lift} />}
        iconColor={accent.lift}
        iconTint="rgba(252, 76, 2, 0.10)"
        iconBorderColor={accent.lift}
        eyebrow={`Next Session · ${upcomingLabel(workout.daysUntil, workout.date)}`}
        eyebrowColor={accent.lift}
        title={workout.name}
        sub={`${workout.exercises} exercises`}
        rightSlot={<ChevronRight size={18} color={text.tertiary} />}
      />
    );
  };

  // Renders the active-plan banner shared across every plan-aware focus
  // state. Pulls plan name + frequency + week-of-N progress out of
  // activePlan.planData when available so it reads like a status bar.
  const renderActivePlanHeader = () => {
    if (!activePlan) return null;
    const planName =
      activePlan.customName || activePlan.planData?.name || 'Active Plan';
    const frequency =
      (activePlan.planData as any)?.frequency_per_week ??
      (activePlan.planData as any)?.frequency ??
      null;

    let weekLabel: string | null = null;
    const startedAt = activePlan.startedAt
      ? new Date(activePlan.startedAt)
      : null;
    const duration = (activePlan.planData as any)?.duration ?? null;
    if (startedAt) {
      const weeksIn =
        Math.floor(
          (today.getTime() - startedAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
        ) + 1;
      weekLabel = duration ? `Week ${weeksIn}/${duration}` : `Week ${weeksIn}`;
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingBottom: spacing.md,
          marginBottom: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: palette.borderStrong,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(252, 76, 2, 0.12)',
            borderWidth: 1,
            borderColor: accent.lift,
          }}
        >
          <Dumbbell size={14} color={accent.lift} />
        </View>
        <View style={{ flex: 1 }}>
          <Eyebrow color={accent.lift}>Active Plan</Eyebrow>
          <Text
            style={{
              color: text.primary,
              fontSize: 14,
              fontWeight: '800',
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {planName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {weekLabel ? (
            <Text
              style={{
                color: text.tertiary,
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 1.4,
                fontVariant: fonts.tabularNums,
                textTransform: 'uppercase',
              }}
            >
              {weekLabel}
            </Text>
          ) : null}
          {frequency ? (
            <Text
              style={{
                color: text.quaternary,
                fontFamily: 'monospace',
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1.4,
                fontVariant: fonts.tabularNums,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              {frequency}× / week
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderTodaysFocus = () => {
    if (todaysWorkout) {
      if (todaysWorkout.type === 'completed') {
        const completedPill = (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingVertical: 4,
              paddingHorizontal: spacing.sm,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: accent.sessionUp,
              backgroundColor: 'rgba(0, 200, 120, 0.08)',
            }}
          >
            <CheckCircle size={12} color={accent.sessionUp} />
            <Text
              style={{
                color: accent.sessionUp,
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1.4,
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
            >
              Today · {todaysWorkout.name} Done
            </Text>
          </View>
        );

        if (!upcomingWorkout) {
          return (
            <View style={{ gap: spacing.md }}>
              {renderActivePlanHeader()}
              {completedPill}
              <Text style={{ color: text.tertiary, fontSize: 14 }}>
                Good job crushing {todaysWorkout.name}! Nothing else scheduled this week.
              </Text>
            </View>
          );
        }

        return (
          <View style={{ gap: spacing.lg }}>
            {renderActivePlanHeader()}
            {completedPill}

            <View>
              <Text
                style={{
                  color: text.primary,
                  fontSize: 28,
                  fontWeight: '900',
                  letterSpacing: -0.6,
                  marginBottom: spacing.xs,
                }}
              >
                {upcomingWorkout.name.toUpperCase()}
              </Text>
              <Eyebrow color={accent.lift}>
                Up Next · {upcomingLabel(upcomingWorkout.daysUntil, upcomingWorkout.date)}
              </Eyebrow>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              <Stat value={upcomingWorkout.exercises} label="Exercises" />
              <Stat value={estimateMinutes(upcomingWorkout.exercises)} label="Minutes" />
            </View>

            <NeonButton
              testID="home-start-upcoming"
              onPress={() => startUpcoming(upcomingWorkout)}
              style={{ width: '100%' }}
            >
              <Play size={18} color={palette.bg} />
              <Text style={{ marginLeft: spacing.sm, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, color: palette.bg }}>
                START EARLY
              </Text>
            </NeonButton>

            {renderNextSessionFooter(sessionAfterNext)}
          </View>
        );
      }
      if (todaysWorkout.type === 'planned') {
        return (
          <View style={{ gap: spacing.lg }}>
            {renderActivePlanHeader()}

            <View>
              <Text
                style={{
                  color: text.primary,
                  fontSize: 28,
                  fontWeight: '900',
                  letterSpacing: -0.6,
                  marginBottom: spacing.xs,
                }}
              >
                {todaysWorkout.name.toUpperCase()}
              </Text>
              <Eyebrow color={accent.lift}>Today's Session</Eyebrow>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              <Stat value={todaysWorkout.exercises} label="Exercises" />
              <Stat value={estimateMinutes(todaysWorkout.exercises)} label="Minutes" />
            </View>

            <NeonButton
              onPress={() => {
                const sid = (todaysWorkout as any).sessionId;
                if (sid && onStartUpcoming) onStartUpcoming(sid);
                else onChangeView('gym');
              }}
              style={{ width: '100%' }}
            >
              <Play size={18} color={palette.bg} />
              <Text style={{ marginLeft: spacing.sm, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, color: palette.bg }}>
                START WORKOUT
              </Text>
            </NeonButton>

            {/* Even with a session scheduled today, the user may want to swap
                in a different plan-session or build something custom. Render
                as flat list rows (not nested cards) so the active-plan card
                doesn't card-in-card-in-card itself. */}
            <View
              style={{
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: palette.borderStrong,
              }}
            >
              <BannerRow
                flat
                testID="home-pick-from-library-planned"
                onPress={handlePickFromLibrary}
                accessibilityLabel="Pick a different workout from any plan"
                icon={<Layout size={16} color={text.primary} />}
                eyebrow="From any plan"
                title="Pick a Different Workout"
                sub="Swap today's session for any other"
                rightSlot={<ChevronRight size={18} color={text.tertiary} />}
              />
              <View style={{ height: 1, backgroundColor: palette.borderStrong }} />
              <BannerRow
                flat
                testID="home-start-custom-planned"
                onPress={handleStartCustom}
                accessibilityLabel="Start custom workout"
                icon={<PlusCircle size={16} color={text.primary} />}
                eyebrow="Blank Session"
                title="Start Custom Workout"
                sub="Build something exercise by exercise"
                rightSlot={<ChevronRight size={18} color={text.tertiary} />}
              />
            </View>
          </View>
        );
      }
    }

    if (!activePlan) {
      return (
        <View style={{ gap: spacing.lg }}>
          <View>
            <Text
              style={{
                color: text.primary,
                fontSize: 28,
                fontWeight: '900',
                letterSpacing: -0.6,
                marginBottom: spacing.xs,
              }}
            >
              NO ACTIVE PLAN
            </Text>
            <Text style={{ color: text.tertiary, fontSize: 14 }}>
              Pick a workout plan to schedule your week, or jump into a custom session.
            </Text>
          </View>

          <NeonButton onPress={() => onChangeView('gym')} style={{ width: '100%' }}>
            <Calendar size={18} color={palette.bg} />
            <Text style={{ marginLeft: spacing.sm, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, color: palette.bg }}>
              BROWSE PLANS
            </Text>
          </NeonButton>

          <BannerRow
            testID="home-start-custom-no-plan"
            onPress={handleStartCustom}
            accessibilityLabel="Start custom workout"
            icon={<PlusCircle size={16} color={text.primary} />}
            eyebrow="Blank Session"
            title="Start Custom Workout"
            sub="Build something exercise by exercise"
            rightSlot={<ChevronRight size={18} color={text.tertiary} />}
          />

          <BannerRow
            testID="home-pick-from-library"
            onPress={handlePickFromLibrary}
            accessibilityLabel="Pick a workout from any plan"
            icon={<Layout size={16} color={text.primary} />}
            eyebrow="From any plan"
            title="Pick a Workout"
            sub="Try a single session ad-hoc"
            rightSlot={<ChevronRight size={18} color={text.tertiary} />}
          />
        </View>
      );
    }

    // Active plan, today is rest. REST DAY stays as the visual hero;
    // Next Session moves to the top of the action stack so the most
    // likely tap is closest to the headline.
    return (
      <View style={{ gap: spacing.lg }}>
        {renderActivePlanHeader()}

        <View>
          <Text
            style={{
              color: text.primary,
              fontSize: 28,
              fontWeight: '900',
              letterSpacing: -0.6,
              marginBottom: spacing.xs,
            }}
          >
            REST DAY
          </Text>
          <Text style={{ color: text.tertiary, fontSize: 14 }}>
            Active recovery or light cardio recommended.
          </Text>
        </View>

        {renderNextSessionFooter(upcomingWorkout)}

        <BannerRow
          testID="home-pick-from-library-rest-day"
          onPress={handlePickFromLibrary}
          accessibilityLabel="Pick a workout from any plan"
          icon={<Layout size={16} color={text.primary} />}
          eyebrow="From any plan"
          title="Pick a Workout"
          sub="Lift a different session today"
          rightSlot={<ChevronRight size={18} color={text.tertiary} />}
        />

        <BannerRow
          testID="home-start-custom-rest-day"
          onPress={handleStartCustom}
          accessibilityLabel="Start custom workout"
          icon={<PlusCircle size={16} color={text.primary} />}
          eyebrow="Blank Session"
          title="Start Custom Workout"
          sub="Build something exercise by exercise"
          rightSlot={<ChevronRight size={18} color={text.tertiary} />}
        />
      </View>
    );
  };

  return (
    <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
      {/* Today's Focus — primary card. Outer hairline border in lift-orange
          when an active plan is in play; falls back to neutral surface
          treatment when there's no plan to anchor it. */}
      <View
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: activePlan ? 1 : 1,
          borderColor: activePlan ? accent.lift : palette.borderStrong,
          backgroundColor: palette.surface,
          overflow: 'hidden',
          shadowColor: activePlan ? accent.lift : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: activePlan ? 0.15 : 0.2,
          shadowRadius: 8,
        }}
      >
        <View style={{ padding: spacing.xl }}>{renderTodaysFocus()}</View>
      </View>

      {/* Fuel — meal/water shortcuts. Sits BETWEEN the workout focus card
          and the schedule card so workout and nutrition have visually
          distinct sections (separate borders, separate eyebrows). One
          tap from Home to log a meal or jump to water. */}
      <View
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surface,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radii.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surfaceAlt,
              borderWidth: 1,
              borderColor: palette.borderStrong,
            }}
          >
            <UtensilsCrossed size={14} color={text.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>Fuel</Eyebrow>
            <Text
              style={{
                color: text.primary,
                fontSize: 14,
                fontWeight: '800',
                marginTop: 2,
              }}
            >
              Log a meal or water
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <BannerRow
            testID="home-log-meal"
            onPress={handleLogMeal}
            accessibilityLabel="Log a meal"
            icon={<UtensilsCrossed size={16} color={accent.lift} />}
            iconTint="rgba(252, 76, 2, 0.10)"
            iconBorderColor={accent.lift}
            eyebrow="Nutrition"
            title="Log a Meal"
            sub="Pick a slot, fill kcal, save"
            rightSlot={<ChevronRight size={18} color={text.tertiary} />}
          />
          <BannerRow
            testID="home-log-water"
            onPress={handleLogWater}
            accessibilityLabel="Log water intake"
            icon={<Droplet size={16} color={accent.sessionUp} />}
            iconTint="rgba(0, 214, 143, 0.10)"
            iconBorderColor={accent.sessionUp}
            eyebrow="Hydration"
            title="Log Water"
            sub="+ Cup / + Bottle"
            rightSlot={<ChevronRight size={18} color={text.tertiary} />}
          />
        </View>
      </View>

      {/* Full month calendar — same component as the (now removed) Calendar
          tab. Wrapped in a bordered surface card so it reads as a sibling
          section to the focus card above. */}
      <View
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surface,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radii.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surfaceAlt,
              borderWidth: 1,
              borderColor: palette.borderStrong,
            }}
          >
            <Calendar size={14} color={text.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>Schedule</Eyebrow>
            <Text
              style={{
                color: text.primary,
                fontSize: 14,
                fontWeight: '800',
                marginTop: 2,
              }}
            >
              Month at a glance
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg }}>
          <CalendarView embedded />
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeView;
