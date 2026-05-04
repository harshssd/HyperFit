import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hexagon, Flame, LogOut } from 'lucide-react-native';
import { headerStyles } from '../styles';
import ProgressRing from './ProgressRing';
import { getRankProgress } from '../features/workout/helpers';
import { palette, accent, spacing, text } from '../styles/theme';

type HeaderProps = {
  streak?: number;
  xp?: number;
  username?: string;
  onLogout?: () => void;
};

const Header = ({ streak = 0, xp = 0, onLogout, username }: HeaderProps) => {
  const { current: currentRank, progress } = getRankProgress(xp);
  const insets = useSafeAreaInsets();

  // Pad past the OS status bar so the time/signal icons don't overlap the
  // brand row. Done here (not via SafeAreaView) so transparentModal screens —
  // where the safe-area context's top edge can be lost — still render correctly.
  return (
    <View style={[headerStyles.header, { paddingTop: insets.top + spacing.sm }]}>
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
          <TouchableOpacity onPress={onLogout} style={headerStyles.logoutButton}>
            <LogOut size={16} color={text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={headerStyles.progressBar}>
        <View style={[headerStyles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

export default Header;

