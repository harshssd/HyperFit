import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Hexagon, Flame } from 'lucide-react-native';
import { headerStyles } from '../styles';
import ProgressRing from './ProgressRing';
import { getRankProgress } from '../features/workout/helpers';
import { palette, accent, spacing, text, fonts } from '../styles/theme';

type HeaderProps = {
  streak?: number;
  xp?: number;
  username?: string;
  /** Tap target for the avatar circle in the top-right. Opens the Profile
   *  modal — replaces the old direct-logout shortcut now that sign-out lives
   *  inside Profile. */
  onOpenProfile?: () => void;
  /** 1-2 letter monogram for the avatar circle. */
  avatarInitials?: string;
};

const Header = ({ streak = 0, xp = 0, onOpenProfile, avatarInitials, username }: HeaderProps) => {
  const { current: currentRank, progress } = getRankProgress(xp);
  const insets = useSafeAreaInsets();

  // Pad past the OS status bar so the time/signal icons don't overlap the
  // brand row. Done here (not via SafeAreaView) so transparentModal screens
  // still render correctly — react-native-screens returns insets.top=0 inside
  // a transparentModal on iOS, so we floor against Constants.statusBarHeight
  // (the measured status bar height, independent of safe-area context).
  const topPad = Math.max(insets.top, Constants.statusBarHeight) + spacing.sm;
  return (
    <View
      style={[
        headerStyles.header,
        { paddingTop: topPad },
      ]}
    >
      <View style={headerStyles.headerTop}>
        <View style={headerStyles.headerLeft}>
          <View style={headerStyles.headerLogo}>
            <Hexagon size={22} color={palette.bg} strokeWidth={3} />
          </View>
          <View>
            <Text style={headerStyles.headerTitle}>
              HYPER<Text style={headerStyles.headerTitleAccent}>FIT</Text>
            </Text>
            <View style={headerStyles.headerRank}>
              <Text style={[headerStyles.headerRankText, { color: currentRank.color, borderColor: currentRank.color }]}>
                {username || currentRank.title}
              </Text>
            </View>
          </View>
        </View>
        <View style={headerStyles.headerRight}>
          <View style={headerStyles.streakContainer}>
            <Flame size={16} color={streak > 0 ? accent.lift : text.disabled} />
            <Text style={headerStyles.streakText}>{streak}</Text>
          </View>
          {onOpenProfile ? (
            <TouchableOpacity
              onPress={onOpenProfile}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(252, 76, 2, 0.12)',
                borderWidth: 1,
                borderColor: accent.lift,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: text.primary,
                  fontSize: 11,
                  fontWeight: fonts.weight.bold as '700',
                  fontFamily: fonts.family.mono,
                  letterSpacing: 0.5,
                }}
              >
                {avatarInitials ?? '—'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={headerStyles.progressBar}>
        <View style={[headerStyles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

export default Header;

