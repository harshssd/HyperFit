import { UserData } from '../../types/workout';

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const getAllExerciseNames = (data: UserData, masterExercises: string[] = []) => {
  const historyNames = Object.values(data.workouts || {})
    .flat()
    .map((w: any) => w.name)
    .filter(Boolean);
  const uniqueNames = [...new Set([...(masterExercises || []), ...historyNames])];
  return uniqueNames.sort();
};



