import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  ChevronRight,
  Droplet,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import { ForkKnifeCrossed } from '../../components/icons/ForkKnifeCrossed';
import { palette, accent, text, spacing, radii } from '../../styles/theme';

// Local Eyebrow + BannerRow mirror HomeView so the Nutrition tab reads as a
// sibling surface, not a different design language. Hoist into a shared
// component the moment a third surface needs them.

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

type BannerRowProps = {
  icon: React.ReactNode;
  iconTint?: string;
  iconBorderColor?: string;
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  sub?: string;
  rightSlot?: React.ReactNode;
  testID?: string;
};

const BannerRow = ({
  icon,
  iconTint = palette.surfaceAlt,
  iconBorderColor = palette.borderStrong,
  eyebrow,
  eyebrowColor,
  title,
  sub,
  rightSlot,
  testID,
}: BannerRowProps) => (
  <View
    testID={testID}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      backgroundColor: palette.surfaceAlt,
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

/**
 * Nutrition tab — empty-state shell. Pattern matches HomeView's "Today's
 * Focus" card: orange-hairline outer surface, icon-chip header strip, big
 * title, stack of BannerRows for sub-actions. No radial gradients, no
 * 48px hero numerics — that direction was reverted on the workout side.
 *
 * PR 1 ships visuals only. Logging, water taps, cheat toggle, and the
 * goal-setup sheet land in PR 2.
 */
export const NutritionView = () => {
  // Hardcoded for now — wired to user_nutrition_settings in PR 2.
  const kcalTarget = 2200;
  const proteinTarget = 160;
  const carbTarget = 250;
  const fatTarget = 70;
  const fiberTarget = 30;
  const waterTarget = 2000;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Today's Focus — orange-hairline outer surface, mirrors HomeView. */}
      <View
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: accent.lift,
          backgroundColor: palette.surface,
          overflow: 'hidden',
          shadowColor: accent.lift,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}
      >
        <View style={{ padding: spacing.xl }}>
          {/* Header strip: icon chip + DAILY GOAL eyebrow + kcal target +
              compact macro readout on the right. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingBottom: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: palette.borderStrong,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(252, 76, 2, 0.12)',
                borderWidth: 1,
                borderColor: accent.lift,
              }}
            >
              <ForkKnifeCrossed size={16} color={accent.lift} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow color={accent.lift}>Daily Goal</Eyebrow>
              <Text
                style={{
                  color: text.primary,
                  fontSize: 18,
                  fontWeight: '900',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {kcalTarget.toLocaleString()} kcal
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  color: text.tertiary,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  letterSpacing: 1.2,
                }}
              >
                {proteinTarget}P · {carbTarget}C · {fatTarget}F
              </Text>
              <Text
                style={{
                  color: text.quaternary,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  letterSpacing: 1.2,
                  marginTop: 2,
                }}
              >
                {fiberTarget}g FIBER
              </Text>
            </View>
          </View>

          {/* Empty state — the "REST DAY" parallel: big title + sub. */}
          <Text
            style={{
              color: text.primary,
              fontSize: 30,
              fontWeight: '900',
              letterSpacing: -0.9,
            }}
          >
            NO MEALS YET
          </Text>
          <Text
            style={{
              color: text.tertiary,
              fontSize: 14,
              marginTop: 6,
              marginBottom: spacing.lg,
              lineHeight: 20,
            }}
          >
            Log a meal to start tracking today. Water and cheat-day land here next.
          </Text>

          {/* Stacked BannerRows — Water + four meal slots. Tap-to-log
              wires up in PR 2; the rows render the silhouette today. */}
          <View style={{ gap: spacing.sm }}>
            <BannerRow
              testID="nutrition-water"
              icon={<Droplet size={16} color={accent.sessionUp} />}
              iconTint="rgba(0, 214, 143, 0.10)"
              iconBorderColor={accent.sessionUp}
              eyebrow="Water"
              eyebrowColor={accent.sessionUp}
              title={`0 / ${waterTarget.toLocaleString()} ml`}
              sub="Tap a cup or bottle"
              rightSlot={<ChevronRight size={18} color={text.tertiary} />}
            />
            <BannerRow
              testID="nutrition-add-breakfast"
              icon={<Plus size={16} color={text.secondary} />}
              eyebrow="Breakfast"
              title="Add meal"
              rightSlot={<ChevronRight size={18} color={text.tertiary} />}
            />
            <BannerRow
              testID="nutrition-add-lunch"
              icon={<Plus size={16} color={text.secondary} />}
              eyebrow="Lunch"
              title="Add meal"
              rightSlot={<ChevronRight size={18} color={text.tertiary} />}
            />
            <BannerRow
              testID="nutrition-add-dinner"
              icon={<Plus size={16} color={text.secondary} />}
              eyebrow="Dinner"
              title="Add meal"
              rightSlot={<ChevronRight size={18} color={text.tertiary} />}
            />
            <BannerRow
              testID="nutrition-add-snack"
              icon={<Plus size={16} color={text.secondary} />}
              eyebrow="Snack"
              title="Add meal"
              rightSlot={<ChevronRight size={18} color={text.tertiary} />}
            />
          </View>
        </View>
      </View>

      {/* Cheat Day — separate sibling card outside the orange surface, same
          neutral treatment as Home's "Pick a Workout" / "Custom" footer
          banners. */}
      <View
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surface,
          padding: spacing.lg,
        }}
      >
        <BannerRow
          testID="nutrition-cheat-day"
          icon={<Sparkles size={16} color={text.tertiary} />}
          eyebrow="Cheat Day · 1 / wk"
          title="Off today"
          sub="Toggle on to skip macro tracking — streak stays intact"
          rightSlot={<ChevronRight size={18} color={text.tertiary} />}
        />
      </View>

      {/* Coming-soon footer — matches the analytics tab's tone for honest
          "this surface still has more to land" signaling. */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xl,
        }}
      >
        <ForkKnifeCrossed size={40} color={text.disabled} strokeWidth={1.6} />
        <Text
          style={{
            color: text.primary,
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: spacing.md,
          }}
        >
          More fuel tracking coming
        </Text>
        <Text
          style={{
            color: text.quaternary,
            textAlign: 'center',
            marginTop: spacing.xs,
            fontSize: 13,
            paddingHorizontal: spacing.xl,
          }}
        >
          Quick log, water taps, recents, and the cheat-day calendar arrive in PR 2.
        </Text>
      </View>
    </ScrollView>
  );
};
