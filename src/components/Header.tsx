import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Hexagon, Flame, LogOut } from 'lucide-react-native';
import styles from '../styles/appStyles';
import ProgressRing from './ProgressRing';
import { getRankProgress } from '../utils/workoutHelpers';

type HeaderProps = {
  streak?: number;
  xp?: number;
  username?: string;
  onLogout?: () => void;
};

const Header = ({ streak = 0, xp = 0, onLogout, username }: HeaderProps) => {
  const { current: currentRank, progress } = getRankProgress(xp);

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Hexagon size={24} color="#0f172a" strokeWidth={3} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              HYPER<Text style={styles.headerTitleAccent}>FIT</Text>
            </Text>
            <View style={styles.headerRank}>
              <Text style={[styles.headerRankText, { color: currentRank.color }]}>
                {username || currentRank.title}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakContainer}>
            <Flame size={16} color={streak > 0 ? "#f97316" : "#475569"} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <LogOut size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

export default Header;

