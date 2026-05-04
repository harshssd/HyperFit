import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, LogOut, X } from 'lucide-react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { palette, accent, text, spacing, radii, fonts } from '../styles/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const deriveInitials = (email?: string | null): string => {
  if (!email) return '—';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return (local[0] ?? '—').toUpperCase();
  if (parts.length === 1) return (parts[0][0] ?? '—').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[1][0] ?? '')).toUpperCase();
};

export const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuthContext();
  const { data } = useAppData();

  const email = user?.email ?? '';
  const initials = deriveInitials(email);
  const activePlan = data.userWorkoutPlans?.find(p => p.isActive);
  const activePlanLabel =
    activePlan?.customName ?? activePlan?.planData?.name ?? 'No active plan';
  const version =
    Constants.expoConfig?.version ??
    (Constants as unknown as { manifest2?: { extra?: { version?: string } } })
      .manifest2?.extra?.version ??
    '—';

  const handleClose = () => navigation.goBack();

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'You will need to sign in again to access your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              Alert.alert('Sign out failed', 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleManagePlan = () => {
    navigation.navigate('Main', { screen: 'Plans' } as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
        }}
      >
        <Text
          style={{
            color: text.primary,
            fontSize: 22,
            fontWeight: fonts.weight.bold as '700',
            letterSpacing: 0.5,
          }}
        >
          Profile
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={12}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <X size={22} color={text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View
          style={{
            alignItems: 'center',
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: palette.surfaceAlt,
              borderWidth: 1,
              borderColor: accent.lift,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                color: text.primary,
                fontSize: 24,
                fontWeight: fonts.weight.bold as '700',
                fontFamily: fonts.family.mono,
                letterSpacing: 1,
              }}
            >
              {initials}
            </Text>
          </View>
          <Text
            style={{
              color: text.primary,
              fontSize: 15,
              fontWeight: fonts.weight.semibold as '600',
            }}
            numberOfLines={1}
          >
            {email || 'Signed in'}
          </Text>
        </View>

        <SmallLabel>ACCOUNT</SmallLabel>
        <Section>
          <Row
            label="Active plan"
            value={activePlanLabel}
            onPress={handleManagePlan}
          />
          <Row
            label="Sign out"
            destructive
            icon={<LogOut size={16} color={accent.regression} />}
            onPress={handleSignOut}
            hideChevron
          />
        </Section>

        <SmallLabel>ABOUT</SmallLabel>
        <Section>
          <Row label="Version" value={version} hideChevron />
        </Section>
      </ScrollView>
    </View>
  );
};

const SmallLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    style={{
      color: text.quaternary,
      fontSize: 11,
      fontWeight: fonts.weight.semibold as '600',
      letterSpacing: 1.2,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    }}
  >
    {children}
  </Text>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      marginHorizontal: spacing.lg,
      borderRadius: radii.lg,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      overflow: 'hidden',
    }}
  >
    {children}
  </View>
);

type RowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  icon?: React.ReactNode;
  hideChevron?: boolean;
};

const Row = ({
  label,
  value,
  onPress,
  destructive,
  icon,
  hideChevron,
}: RowProps) => {
  const labelColor = destructive ? accent.regression : text.primary;
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.borderSubtle,
      }}
    >
      {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
      <Text
        style={{
          color: labelColor,
          fontSize: 15,
          fontWeight: fonts.weight.medium as '500',
          flex: 1,
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text
          style={{
            color: text.tertiary,
            fontSize: 14,
            fontVariant: fonts.tabularNums,
            marginRight: hideChevron ? 0 : spacing.xs,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {onPress && !hideChevron ? (
        <ChevronRight size={18} color={text.quaternary} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View style={{ borderTopWidth: 0 }}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: palette.surfaceAlt }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
};
