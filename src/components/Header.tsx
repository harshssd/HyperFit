import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Hexagon, Flame, LogOut } from 'lucide-react-native';
import { headerStyles } from '../styles';
import ProgressRing from './ProgressRing';
import { getRankProgress } from '../features/workout/helpers';

type HeaderProps = {
  streak?: number;
  xp?: number;
  username?: string;
  onLogout?: () => void;
};

const Header = ({ streak = 0, xp = 0, onLogout, username }: HeaderProps) => {
  const { current: currentRank, progress } = getRankProgress(xp);

  return (
    <View style={headerStyles.header}>
      <View style={headerStyles.headerTop}>
        <View style={headerStyles.headerLeft}>
          <View style={headerStyles.headerLogo}>
            <Hexagon size={24} color="#0f172a" strokeWidth={3} />
          </View>
          <View>
            <Text style={headerStyles.headerTitle}>
              HYPER<Text style={headerStyles.headerTitleAccent}>FIT</Text>
            </Text>
            <View style={headerStyles.headerRank}>
              <Text style={[headerStyles.headerRankText, { color: currentRank.color }]}>
                {username || currentRank.title}
              </Text>
            </View>
          </View>
        </View>
        <View style={headerStyles.headerRight}>
          <View style={headerStyles.streakContainer}>
            <Flame size={16} color={streak > 0 ? "#f97316" : "#475569"} />
            <Text style={headerStyles.streakText}>{streak}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={headerStyles.logoutButton}>
            <LogOut size={16} color="#94a3b8" />
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

