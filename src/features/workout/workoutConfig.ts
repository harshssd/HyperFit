export const getTodayString = () => new Date().toISOString().split('T')[0];

/**
 * Sorted, de-duplicated exercise-name list for the manual-add autocomplete.
 * Reads only from the master `exercises` table (passed in as
 * `masterExercises`); the previous implementation also folded names from
 * `data.workouts` but that field was never populated, so the branch was
 * silently a no-op and confused future readers.
 */
export const getAllExerciseNames = (masterExercises: string[] = []) => {
  return [...new Set(masterExercises)].sort();
};
