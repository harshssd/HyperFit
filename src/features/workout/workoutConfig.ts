import { DEFAULT_EXERCISES } from '../../constants/appConstants';
import { UserData } from '../../types/workout';

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const getAllExerciseNames = (data: UserData) => {
  const historyNames = Object.values(data.workouts || {}).flat().map((w: any) => w.name);
  const uniqueNames = [...new Set([...DEFAULT_EXERCISES, ...historyNames])];
  return uniqueNames.sort();
};


