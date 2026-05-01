import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { palette, text, accent, fonts, space } from '../../../styles/theme';

type WorkoutFocusHeaderProps = {
  currentExerciseName?: string;
  currentIndex: number;
  totalExercises: number;
  onPrev: () => void;
  onNext: () => void;
};

const padIndex = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

const WorkoutFocusHeader = ({
  currentExerciseName,
  currentIndex,
  totalExercises,
  onPrev,
  onNext,
}: WorkoutFocusHeaderProps) => {
  const atFirst = currentIndex === 0;
  const atLast = currentIndex === totalExercises - 1;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onPrev}
        disabled={atFirst}
        style={[styles.navBtn, atFirst && styles.navBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Previous exercise"
      >
        <ChevronLeft size={22} color={atFirst ? text.disabled : text.tertiary} />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {currentExerciseName ?? '—'}
        </Text>
        <Text style={styles.progress}>
          {padIndex(currentIndex + 1)} / {padIndex(totalExercises)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={atLast}
        style={[styles.navBtn, atLast && styles.navBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Next exercise"
      >
        <ChevronRight size={22} color={atLast ? text.disabled : text.tertiary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderColor: palette.borderSubtle,
    marginBottom: space.lg,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  navBtnDisabled: {
    opacity: 0.4,
    backgroundColor: 'transparent',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: text.primary,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  progress: {
    fontSize: 10,
    color: accent.lift,
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    letterSpacing: 2,
    marginTop: space['2sm'],
    fontWeight: '700',
  },
});

export default WorkoutFocusHeader;
