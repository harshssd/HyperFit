import { Clock, Hash } from 'lucide-react-native';

/**
 * Per-exercise UI config: which input labels, placeholders, and icons to
 * show for a given exercise name. Lives outside `mutations`/`stats` because
 * it pulls in lucide icons (a UI dep), but it's still a pure function.
 */
export const getExerciseConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('plank') || lower.includes('hold') || lower.includes('static') || lower.includes('wall sit')) {
    return { type: 'timed', weightLabel: 'LBS (OPT)', repLabel: 'TIME (S)', repIcon: Clock, weightPlaceholder: '-', repPlaceholder: '30s', weightStep: 5, repStep: 10 };
  }
  if (
    lower.includes('pushup') ||
    lower.includes('pull up') ||
    lower.includes('chin up') ||
    lower.includes('dip') ||
    lower.includes('burpee') ||
    lower.includes('lunge') ||
    (lower.includes('squat') && !lower.includes('barbell'))
  ) {
    if (name === 'Squats') return { type: 'weighted', weightLabel: 'LBS', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: '135', repPlaceholder: '10', weightStep: 5, repStep: 1 };
    return { type: 'bodyweight', weightLabel: 'LBS (OPT)', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: 'BW', repPlaceholder: '12', weightStep: 5, repStep: 1 };
  }
  return { type: 'weighted', weightLabel: 'LBS', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: '45', repPlaceholder: '10', weightStep: 5, repStep: 1 };
};
